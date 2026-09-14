import os
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


def train_festival_model():
    festivals = FestivalSubmission.objects.all()
    if len(festivals) < 3:
        print("Not enough data — using dummy data")
        df = pd.DataFrame({
            'submission_fee': [25, 50, 100, 75, 30, 40, 60, 80],
            'selection_probability': [0.6, 0.75, 0.45, 0.9, 0.55, 0.7, 0.65, 0.8],
            'accepted': [0, 1, 0, 1, 0, 1, 1, 1],
        })
    else:
        df = pd.DataFrame([{
            'submission_fee': float(f.submission_fee or 0),
            'selection_probability': float(f.selection_probability or 0),
            'accepted': 1 if f.status in ['Selected', 'Awarded'] else 0,
        } for f in festivals])

    X = df[['submission_fee', 'selection_probability']]
    y = df['accepted']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)

    rf = RandomForestClassifier(n_estimators=100, random_state=42).fit(X_train_s, y_train)
    gb = GradientBoostingClassifier(n_estimators=100, random_state=42).fit(X_train_s, y_train)

    print("Random Forest Accuracy:", accuracy_score(y_test, rf.predict(X_test_s)))
    print("Gradient Boosting Accuracy:", accuracy_score(y_test, gb.predict(X_test_s)))

    model_path = os.path.join(settings.BASE_DIR, 'ml_models')
    os.makedirs(model_path, exist_ok=True)
    joblib.dump(rf, os.path.join(model_path, 'festival_model.pkl'))
    joblib.dump(gb, os.path.join(model_path, 'festival_gb_model.pkl'))
    joblib.dump(scaler, os.path.join(model_path, 'scaler.pkl'))
    print("Saved models and scaler to", model_path)


if __name__ == "__main__":
    train_festival_model()