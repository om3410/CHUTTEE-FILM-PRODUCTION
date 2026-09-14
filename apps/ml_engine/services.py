import os
import joblib
import numpy as np
from django.conf import settings


class MLService:
    def __init__(self):
        self.festival_model = None
        self.scaler = None
        self.load_models()

    def load_models(self):
        model_dir = os.path.join(settings.BASE_DIR, 'ml_models')
        try:
            self.festival_model = joblib.load(os.path.join(model_dir, 'festival_model.pkl'))
            self.scaler = joblib.load(os.path.join(model_dir, 'scaler.pkl'))
        except FileNotFoundError:
            pass

    def predict_festival(self, features):
        if self.festival_model is None:
            return {'error': 'Model not trained'}
        X = np.array([[
            features['submission_fee'],
            features['competition_level'],
            features['duration_minutes'],
            features['budget'],
        ]])
        if self.scaler:
            X = self.scaler.transform(X)
        pred = self.festival_model.predict(X)[0]
        prob = self.festival_model.predict_proba(X)[0]
        return {
            'prediction': 'Accept' if pred == 1 else 'Reject',
            'confidence': float(prob[1] if pred == 1 else prob[0]),
        }


class ScriptSentimentService:
    EMOTION_KEYWORDS = {
        'Anger':   ['angry', 'furious', 'hate', 'rage', 'mad', 'damn', 'stop'],
        'Sadness': ['sad', 'cry', 'tears', 'alone', 'lost', 'sorry', 'miss'],
        'Joy':     ['happy', 'love', 'smile', 'great', 'wonderful', 'yes', 'amazing'],
        'Fear':    ['afraid', 'scared', 'terrified', 'danger', 'help', 'run'],
        'Love':    ['love', 'heart', 'forever', 'together', 'kiss', 'dear'],
        'Irony':   ['pretend', 'actually', 'really', 'sure', 'obviously'],
        'Tension': ['never', 'always', 'enough', 'tired', 'why', 'how'],
    }

    @classmethod
    def analyze(cls, text):
        polarity = 0.0
        subjectivity = 0.5
        try:
            from textblob import TextBlob
            blob = TextBlob(text)
            polarity = float(blob.sentiment.polarity)
            subjectivity = float(blob.sentiment.subjectivity)
        except Exception:
            positive = ['love', 'happy', 'great', 'yes', 'wonderful', 'amazing', 'good']
            negative = ['hate', 'angry', 'sad', 'no', 'bad', 'terrible', 'never']
            words = text.lower().split()
            pos = sum(1 for w in words if w in positive)
            neg = sum(1 for w in words if w in negative)
            total = pos + neg
            polarity = (pos - neg) / total if total else 0.0
            subjectivity = min(1.0, total / max(len(words), 1))

        text_lower = text.lower()
        emotion_scores = {
            e: sum(1 for kw in kws if kw in text_lower)
            for e, kws in cls.EMOTION_KEYWORDS.items()
        }
        dominant = max(emotion_scores, key=emotion_scores.get)
        confidence = min(1.0, emotion_scores[dominant] / 3) if emotion_scores[dominant] else 0.3

        intensity_value = abs(polarity) + confidence * 0.5
        if intensity_value > 0.75:
            intensity = 'High'
        elif intensity_value > 0.4:
            intensity = 'Medium'
        else:
            intensity = 'Low'

        if intensity == 'High':
            pacing = 'Fast cuts, minimal dialogue duration'
        elif intensity == 'Medium':
            pacing = 'Balanced pacing with normal takes'
        else:
            pacing = 'Slow, reflective pacing with long takes'

        return {
            'polarity': round(polarity, 4),
            'subjectivity': round(subjectivity, 4),
            'dominant_emotion': dominant,
            'emotion_confidence': round(confidence, 4),
            'intensity_level': intensity,
            'pacing_suggestion': pacing,
        }


class SceneDurationService:
    @staticmethod
    def predict(features):
        base = features.get('duration_estimate_minutes', 30)
        complexity = features.get('complexity_score', 0.5)
        is_indoor = features.get('is_indoor', True)
        tod = (features.get('time_of_day') or '').lower()
        emotion = (features.get('emotional_tone') or '').lower()

        multiplier = 1.0 + complexity * 0.6
        if not is_indoor:
            multiplier += 0.25
        if tod == 'night':
            multiplier += 0.3
        elif tod in ('morning', 'evening'):
            multiplier += 0.1
        if emotion in ('conflict', 'anger', 'tense'):
            multiplier += 0.2
        elif emotion in ('reflective', 'sadness'):
            multiplier += 0.1

        predicted = round(base * multiplier, 2)
        confidence = round(min(0.95, 0.55 + complexity * 0.4), 4)

        if multiplier > 1.5:
            rec = "Schedule extra takes and backup lighting for this scene."
        elif multiplier > 1.2:
            rec = "Plan for slightly longer than estimated."
        else:
            rec = "Standard duration prediction is reliable."

        return {
            'predicted_minutes': predicted,
            'confidence': confidence,
            'complexity_factor': round(multiplier, 2),
            'recommendation': rec,
        }


class BudgetAnomalyService:
    @staticmethod
    def detect(transactions):
        if len(transactions) < 5:
            return {'anomalies': [], 'message': 'Not enough data (<5 transactions).'}
        try:
            from sklearn.ensemble import IsolationForest
            amounts = np.array([[float(t['amount'])] for t in transactions])
            model = IsolationForest(contamination=0.1, random_state=42)
            labels = model.fit_predict(amounts)
            scores = model.decision_function(amounts)

            anomalies = []
            for i, label in enumerate(labels):
                if label == -1:
                    severity = 'High' if scores[i] < -0.15 else 'Medium'
                    anomalies.append({
                        'transaction_id': transactions[i].get('id'),
                        'amount': transactions[i]['amount'],
                        'category': transactions[i]['category'],
                        'anomaly_score': round(float(scores[i]), 4),
                        'severity': severity,
                        'explanation': f"Unusual spend of {transactions[i]['amount']} in {transactions[i]['category']}",
                    })
            return {'anomalies': anomalies, 'total_checked': len(transactions)}
        except Exception as e:
            return {'anomalies': [], 'error': str(e)}


class CastRecommendationService:
    @staticmethod
    def recommend(role_description, required_skills, min_experience, cast_members):
        try:
            from sklearn.feature_extraction.text import TfidfVectorizer
            from sklearn.metrics.pairwise import cosine_similarity

            if not cast_members:
                return []

            role_text = ' '.join(required_skills + [role_description]).lower()
            corpus = [role_text] + [
                ' '.join(
                    (c.get('special_skills') or []) +
                    [c.get('character_name') or '', c.get('role_type') or '']
                ).lower()
                for c in cast_members
            ]
            vectorizer = TfidfVectorizer()
            tfidf = vectorizer.fit_transform(corpus)
            sims = cosine_similarity(tfidf[0:1], tfidf[1:]).flatten()

            results = []
            for i, c in enumerate(cast_members):
                if (c.get('experience_years') or 0) < min_experience:
                    continue
                results.append({
                    'cast_id': str(c['id']),
                    'full_name': c['full_name'],
                    'match_score': round(float(sims[i]), 4),
                    'reason': f"Skill overlap with {len(required_skills)} required skills",
                })
            results.sort(key=lambda x: x['match_score'], reverse=True)
            return results[:5]
        except Exception as e:
            return [{'error': str(e)}]


class RiskForecastService:
    @staticmethod
    def forecast(risks):
        if not risks:
            return []
        by_type = {}
        for r in risks:
            t = r.get('risk_type') or 'Unknown'
            by_type.setdefault(t, []).append(r)

        forecasts = []
        for rtype, items in by_type.items():
            avg_prob = np.mean([float(i.get('probability') or 0) for i in items])
            avg_impact = np.mean([float(i.get('impact') or 0) for i in items])
            count = len(items)
            forecast_prob = min(0.95, avg_prob * (1 + count * 0.05))
            forecasts.append({
                'risk_type': rtype,
                'predicted_probability': round(forecast_prob, 2),
                'predicted_impact': round(avg_impact, 2),
                'rationale': f"{count} historical occurrences with avg probability {avg_prob:.2f}",
                'preventive_action': RiskForecastService._action_for(rtype),
            })
        forecasts.sort(key=lambda x: x['predicted_probability'] * x['predicted_impact'], reverse=True)
        return forecasts[:5]

    @staticmethod
    def _action_for(rtype):
        actions = {
            'Weather': 'Track daily weather, prepare indoor backup scenes',
            'Budget': 'Weekly variance review, stricter approvals',
            'Schedule': 'Buffer 15% extra time per scene',
            'Technical': 'Pre-check equipment and have spares',
            'Human Resources': 'Backup crew contacts on standby',
            'Legal': 'Verify permits early',
            'Security': 'On-site security presence',
            'Health': 'First-aid kit and health screening',
        }
        return actions.get(rtype, 'Monitor and document')


class FestivalWinService:
    TIER_WEIGHTS = {
        'indie': 0.85,
        'regional': 0.70,
        'national': 0.55,
        'international': 0.40,
    }

    @classmethod
    def predict(cls, festival_name, festival_tier, submission_fee, film_duration, film_genre):
        base = cls.TIER_WEIGHTS.get(festival_tier, 0.5)
        if film_duration <= 20:
            base += 0.05
        elif film_duration > 60:
            base -= 0.10
        if festival_tier == 'international' and submission_fee > 75:
            base += 0.05
        if film_genre.lower() in ('drama', 'documentary'):
            base += 0.05

        probability = round(max(0.05, min(0.98, base)), 4)
        if probability > 0.7:
            tier = 'High'
        elif probability > 0.45:
            tier = 'Medium'
        else:
            tier = 'Low'

        return {
            'festival_name': festival_name,
            'win_probability': probability,
            'tier': tier,
            'factors': {
                'festival_tier': festival_tier,
                'submission_fee': submission_fee,
                'film_duration': film_duration,
                'film_genre': film_genre,
            },
            'recommendation': (
                'Prioritize marketing around this festival.'
                if tier == 'High' else
                'Apply but also target other festivals.'
                if tier == 'Medium' else
                'Focus on smaller regional festivals first.'
            ),
        }


class LocationRecommendationService:
    LOCATION_LIBRARY = [
        {'name': 'Urban Rooftop', 'vibe': 'reflective night', 'indoor': False},
        {'name': 'Cozy Kitchen', 'vibe': 'intimate morning', 'indoor': True},
        {'name': 'Riverside Bench', 'vibe': 'reflective afternoon', 'indoor': False},
        {'name': 'Old Bedroom', 'vibe': 'sadness evening', 'indoor': True},
        {'name': 'Busy Street', 'vibe': 'conflict afternoon', 'indoor': False},
        {'name': 'Empty Church', 'vibe': 'irony night', 'indoor': True},
        {'name': 'Forest Trail', 'vibe': 'inspirational morning', 'indoor': False},
        {'name': 'Studio Loft', 'vibe': 'tense night', 'indoor': True},
    ]

    @classmethod
    def recommend(cls, scene_number, emotional_tone, time_of_day, is_indoor):
        tone = (emotional_tone or '').lower()
        tod = (time_of_day or '').lower()

        scored = []
        for loc in cls.LOCATION_LIBRARY:
            score = 0.3
            if loc['indoor'] == is_indoor:
                score += 0.3
            if tod and tod in loc['vibe']:
                score += 0.2
            if tone and tone in loc['vibe']:
                score += 0.2
            scored.append({
                'recommended_location': loc['name'],
                'match_score': round(score, 4),
                'reasoning': f"Matches {'indoor' if is_indoor else 'outdoor'} + {tod or 'any'} + {tone or 'any'}",
            })
        scored.sort(key=lambda x: x['match_score'], reverse=True)
        return scored[:3]