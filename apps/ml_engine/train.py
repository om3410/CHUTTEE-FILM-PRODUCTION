import sys
import os

# ─── Fix sys.path before anything else ───
# Remove script's own directory (apps/ml_engine) to prevent `apps.py` from shadowing the `apps` package
_script_dir = os.path.dirname(os.path.abspath(__file__))
while _script_dir in sys.path:
    sys.path.remove(_script_dir)

# Add project root (backend/) so `config` and `apps` are importable
_project_root = os.path.dirname(os.path.dirname(_script_dir))
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)
# ─────────────────────────────────────────

import django
import joblib
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.production.models import FestivalSubmission
from django.conf import settings


def get_dummy_data():
    """Return a balanced dummy dataset (20 rows: 10 zeros + 10 ones)."""
    return pd.DataFrame({
        'submission_fee': [25, 50, 100, 75, 30, 40, 60, 80, 20, 90,
                           45, 55, 35, 65, 85, 15, 70, 95, 10, 5],
        'selection_probability': [0.6, 0.75, 0.45, 0.9, 0.55, 0.7, 0.65, 0.8, 0.35, 0.85,
                                  0.5, 0.72, 0.4, 0.68, 0.78, 0.3, 0.66, 0.88, 0.25, 0.2],
        'accepted': [0, 1, 0, 1, 0, 1, 1, 1, 0, 1,
                     0, 1, 0, 1, 1, 0, 1, 1, 0, 0],
    })


def build_dataframe(festivals):
    """Build a DataFrame from real FestivalSubmission records."""
    return pd.DataFrame([{
        'submission_fee': float(f.submission_fee or 0),
        'selection_probability': float(f.selection_probability or 0),
        'accepted': 1 if f.status in ['Selected', 'Awarded'] else 0,
    } for f in festivals])


def train_festival_model():
    festivals = FestivalSubmission.objects.all()
    print(f"Found {len(festivals)} FestivalSubmission records in DB.")

    if len(festivals) >= 5:
        df = build_dataframe(festivals)
        print(f"Real data class distribution: {df['accepted'].value_counts().to_dict()}")
        if df['accepted'].nunique() < 2:
            print("Real data has only one class — falling back to dummy data.")
            df = get_dummy_data()
    else:
        print("Not enough real data — using dummy data.")
        df = get_dummy_data()

    print(f"Final dataset: {len(df)} rows | Class distribution: {df['accepted'].value_counts().to_dict()}")

    X = df[['submission_fee', 'selection_probability']]
    y = df['accepted']

    if y.nunique() < 2:
        print("ERROR: Still only one class. Cannot train. Aborting.")
        return

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )
    print(f"Train size: {len(X_train)} | Test size: {len(X_test)}")
    print(f"Train class distribution: {y_train.value_counts().to_dict()}")

    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)

    rf = RandomForestClassifier(n_estimators=100, random_state=42).fit(X_train_s, y_train)
    print("Random Forest Accuracy:", accuracy_score(y_test, rf.predict(X_test_s)))

    gb = None
    try:
        gb = GradientBoostingClassifier(n_estimators=50, random_state=42).fit(X_train_s, y_train)
        print("Gradient Boosting Accuracy:", accuracy_score(y_test, gb.predict(X_test_s)))
    except Exception as e:
        print(f"GradientBoosting failed: {e}")
        print("Continuing with RandomForest only.")

    model_path = os.path.join(settings.BASE_DIR, 'ml_models')
    os.makedirs(model_path, exist_ok=True)
    joblib.dump(rf, os.path.join(model_path, 'festival_model.pkl'))
    if gb is not None:
        joblib.dump(gb, os.path.join(model_path, 'festival_gb_model.pkl'))
    joblib.dump(scaler, os.path.join(model_path, 'scaler.pkl'))
    print("Saved models and scaler to", model_path)


if __name__ == "__main__":
    train_festival_model()