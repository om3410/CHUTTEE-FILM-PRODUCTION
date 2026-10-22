import os
from pyexpat import features
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
            self.festival_model = joblib.load(
                os.path.join(model_dir, 'festival_model.pkl')
            )
        except FileNotFoundError:
            self.festival_model = None

        try:
            self.scaler = joblib.load(
                os.path.join(model_dir, 'scaler.pkl')
            )
        except FileNotFoundError:
            self.scaler = None

    def predict_festival(self, features):
        # Try the ML model first
        if self.festival_model is not None:
            try:
                X = np.array([[
                    features['submission_fee'],
                    features['competition_level'],
                    features['duration_minutes'],
                    features['budget'],
                ]])
                pred = int(self.festival_model.predict(X)[0])
                prob = self.festival_model.predict_proba(X)[0]
                return {
                    'prediction': 'Accept' if pred == 1 else 'Reject',
                    'confidence': float(prob[1] if pred == 1 else prob[0]),
                    'method': 'ml_model',
                }
            except Exception:
                # Model expects a different feature count — fall through
                pass

        # Fallback: rule-based heuristic
        return self._festival_heuristic(features)

    def _festival_heuristic(self, features):
        fee = float(features.get('submission_fee') or 0)
        comp = int(features.get('competition_level') or 0)
        dur = int(features.get('duration_minutes') or 20)
        budget = float(features.get('budget') or 0)

        score = 0.5
        score += 0.10 if fee < 100 else -0.05
        score -= comp * 0.10
        score += 0.05 if 10 <= dur <= 30 else -0.05
        score += 0.05 if budget > 100000 else 0.0
        score = max(0.05, min(0.95, score))

        return {
            'prediction': 'Accept' if score >= 0.5 else 'Reject',
            'confidence': round(score, 3),
            'method': 'heuristic',
        }
class ScriptSentimentService:
    """AI-powered dialogue sentiment analysis with heuristic fallback."""

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
        # 1) Try AI first
        ai_result = cls._ai_analyze(text)
        if ai_result is not None:
            return ai_result

        # 2) Fall back to heuristics
        return cls._heuristic_analyze(text)

    # ------------------------------------------------------------------
    # AI path
    # ------------------------------------------------------------------
    @classmethod
    def _ai_analyze(cls, text):
        from .ai_service import ai_call
        import json, re

        prompt = (
            "You are a script analyst. Analyze the emotional content of the "
            "following dialogue and return ONLY a JSON object.\n\n"
            f"Dialogue: {text!r}\n\n"
            "Return JSON with exactly these keys:\n"
            '  "polarity": float between -1.0 (very negative) and 1.0 (very positive)\n'
            '  "subjectivity": float between 0.0 (objective) and 1.0 (subjective)\n'
            '  "dominant_emotion": one of "Anger","Sadness","Joy","Fear","Love","Irony","Tension","Neutral"\n'
            '  "emotion_confidence": float between 0.0 and 1.0\n'
            '  "intensity_level": one of "Low","Medium","High"\n'
            '  "pacing_suggestion": short sentence about how to pace the scene\n'
            "No prose outside the JSON. No markdown fences."
        )

        try:
            response = ai_call(prompt)
            text_out = response['text'].strip()

            # Extract JSON object even if AI wraps it in prose
            match = re.search(r'\{.*\}', text_out, re.DOTALL)
            if not match:
                return None
            data = json.loads(match.group(0))

            # Normalise / clamp
            polarity = max(-1.0, min(1.0, float(data.get('polarity', 0.0))))
            subjectivity = max(0.0, min(1.0, float(data.get('subjectivity', 0.5))))
            confidence = max(0.0, min(1.0, float(data.get('emotion_confidence', 0.3))))

            emotion = data.get('dominant_emotion', 'Neutral')
            if emotion not in list(cls.EMOTION_KEYWORDS.keys()) + ['Neutral']:
                emotion = 'Neutral'

            intensity = data.get('intensity_level', 'Medium')
            if intensity not in ('Low', 'Medium', 'High'):
                intensity = 'Medium'

            pacing = str(data.get(
                'pacing_suggestion',
                'Balanced pacing with normal takes'
            ))[:200]

            return {
                'polarity': round(polarity, 3),
                'subjectivity': round(subjectivity, 3),
                'dominant_emotion': emotion,
                'emotion_confidence': round(confidence, 3),
                'intensity_level': intensity,
                'pacing_suggestion': pacing,
            }
        except Exception:
            return None

    # ------------------------------------------------------------------
    # Heuristic fallback (only used if AI fails)
    # ------------------------------------------------------------------
    @classmethod
    def _heuristic_analyze(cls, text):
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
            'polarity': round(polarity, 3),
            'subjectivity': round(subjectivity, 3),
            'dominant_emotion': dominant,
            'emotion_confidence': round(confidence, 3),
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
            if not cast_members:
                return []

            # Filter by experience first
            eligible = [
                c for c in cast_members
                if (c.get('experience_years') or 0) >= min_experience
            ][:10]

            if not eligible:
                return []

            # Try AI first
            ai_result = CastRecommendationService._ai_match(
                role_description, required_skills, eligible
            )
            if ai_result:
                return ai_result[:5]

            # Fallback: improved heuristic
            return CastRecommendationService._heuristic_match(
                role_description, required_skills, eligible
            )[:5]
        except Exception as e:
            return [{'error': str(e)}]

    # ------------------------------------------------------------------
    # AI path
    # ------------------------------------------------------------------
    @staticmethod
    def _ai_match(role_description, required_skills, cast_members):
        from .ai_service import ai_call
        import json, re

        roster = [
            {
                'id': str(c['id']),
                'name': c['full_name'],
                'skills': c.get('special_skills') or [],
                'character': c.get('character_name') or '',
                'role_type': c.get('role_type') or '',
            }
            for c in cast_members
        ]

        prompt = (
            "You are a casting director. Score how well each actor fits the role.\n"
            f"Role description: {role_description}\n"
            f"Required skills: {', '.join(required_skills)}\n\n"
            f"Candidates:\n{json.dumps(roster, ensure_ascii=False, indent=2)}\n\n"
            "Return ONLY a JSON array of objects with these keys:\n"
            '  {"cast_id": "<id>", "match_score": <0.0-1.0>, "reason": "<short explanation>"}\n'
            "Order from best to worst. No prose outside the JSON array."
        )

        try:
            response = ai_call(prompt, provider_order=None)
            text = response['text'].strip()

            # Extract JSON array even if AI wraps it in markdown fences
            match = re.search(r'\[.*\]', text, re.DOTALL)
            if not match:
                return None
            parsed = json.loads(match.group(0))

            by_id = {str(c['id']): c for c in cast_members}
            results = []
            for item in parsed:
                cid = str(item.get('cast_id', ''))
                c = by_id.get(cid)
                if not c:
                    continue
                results.append({
                    'cast_id': cid,
                    'full_name': c['full_name'],
                    'match_score': round(float(item.get('match_score', 0)), 4),
                    'reason': str(item.get('reason', ''))[:200],
                })
            return results or None
        except Exception:
            return None

    # ------------------------------------------------------------------
    # Heuristic fallback (fuzzy)
    # ------------------------------------------------------------------
    @staticmethod
    def _heuristic_match(role_description, required_skills, cast_members):
        required_set = {
            s.lower().strip()
            for s in (required_skills or [])
            if s and s.strip()
        }
        req_count = len(required_set) or 1

        role_words = {
            w.strip('.,;:!?').lower()
            for w in (role_description or '').split()
            if w.strip()
        }

        results = []
        for c in cast_members:
            skills = {
                s.lower().strip()
                for s in (c.get('special_skills') or [])
                if s and s.strip()
            }

            # Fuzzy: substring match in either direction
            matched = set()
            for req in required_set:
                for sk in skills:
                    if req in sk or sk in req:
                        matched.add(req)
                        break

            skill_score = len(matched) / req_count
            missing = required_set - matched

            cast_words = {
                w.strip('.,;:!?').lower()
                for w in ' '.join([
                    c.get('character_name') or '',
                    c.get('role_type') or '',
                ]).split()
                if w.strip()
            }
            text_score = len(role_words & cast_words) / max(len(role_words), 1)

            score = round(min(skill_score * 0.7 + text_score * 0.3, 1.0), 4)

            if matched and not missing:
                reason = f"Matches all required skills: {', '.join(sorted(matched))}"
            elif matched:
                reason = (
                    f"Matches {len(matched)}/{req_count} skills "
                    f"({', '.join(sorted(matched))}); missing: {', '.join(sorted(missing))}"
                )
            else:
                reason = "No direct skill match — ranked by text similarity"

            results.append({
                'cast_id': str(c['id']),
                'full_name': c['full_name'],
                'match_score': score,
                'reason': reason,
            })

        results.sort(key=lambda x: x['match_score'], reverse=True)
        return results


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