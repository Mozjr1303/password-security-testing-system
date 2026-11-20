from main import evaluate_password_strength


def test_weak_common_password():
    res = evaluate_password_strength("password")
    assert res["strength_category"] in ("Very Weak", "Weak")
    assert res["overall_score"] <= 20
    assert any("dictionary" in p.lower() for p in res["pattern_findings"])


def test_leetspeak_substitution_detection():
    res = evaluate_password_strength("p@ssw0rd")
    assert any("leetspeak" in p.lower() for p in res["pattern_findings"])
    assert res["overall_score"] < 60


def test_strong_random_passphrase():
    res = evaluate_password_strength("Quantum#Falcon79!Nebula$Orbit2")
    assert res["strength_category"] == "Very Strong"
    assert res["overall_score"] >= 85
    assert res["entropy_estimate"] > 70
