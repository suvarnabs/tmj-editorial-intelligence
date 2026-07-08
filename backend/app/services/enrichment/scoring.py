from typing import Any


def _score_value(value: Any) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return 0
    return max(0, min(number, 100))


def calculate_editorial_score(scoring_inputs: dict[str, Any]) -> float:
    score = (
        _score_value(scoring_inputs.get("public_impact")) * 0.25
        + _score_value(scoring_inputs.get("kerala_relevance")) * 0.30
        + _score_value(scoring_inputs.get("urgency")) * 0.20
        + _score_value(scoring_inputs.get("originality_potential")) * 0.15
        + _score_value(scoring_inputs.get("follow_up_value")) * 0.10
    )
    return round(max(0, min(score, 100)), 2)
