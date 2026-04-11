import re

from app.security.tokens import generate_token, hash_token, verify_token


class TestGenerateToken:
    def test_returns_string(self):
        token = generate_token()
        assert isinstance(token, str)

    def test_length_at_least_32_chars(self):
        token = generate_token()
        # 32 bytes base64url-encoded = 43 chars
        assert len(token) >= 32

    def test_url_safe_characters(self):
        token = generate_token()
        assert re.fullmatch(r"[A-Za-z0-9_-]+", token)

    def test_unique_each_call(self):
        tokens = {generate_token() for _ in range(50)}
        assert len(tokens) == 50


class TestHashToken:
    def test_returns_bcrypt_hash(self):
        h = hash_token("test-token")
        assert h.startswith("$2b$")

    def test_different_hash_each_call(self):
        h1 = hash_token("same-token")
        h2 = hash_token("same-token")
        assert h1 != h2

    def test_hash_is_string(self):
        h = hash_token("token")
        assert isinstance(h, str)


class TestVerifyToken:
    def test_correct_token_verifies(self):
        token = generate_token()
        h = hash_token(token)
        assert verify_token(token, h) is True

    def test_wrong_token_fails(self):
        token = generate_token()
        h = hash_token(token)
        assert verify_token("wrong-token", h) is False

    def test_empty_token_fails(self):
        h = hash_token("real-token")
        assert verify_token("", h) is False

    def test_similar_token_fails(self):
        token = generate_token()
        h = hash_token(token)
        # Flip last character
        altered = token[:-1] + ("A" if token[-1] != "A" else "B")
        assert verify_token(altered, h) is False


class TestTokenRoundTrip:
    def test_full_flow(self):
        """Simulates series creation: generate 3 tokens, hash, verify each."""
        blue_token = generate_token()
        red_token = generate_token()
        spec_token = generate_token()

        blue_hash = hash_token(blue_token)
        red_hash = hash_token(red_token)
        spec_hash = hash_token(spec_token)

        # Each token only matches its own hash
        assert verify_token(blue_token, blue_hash) is True
        assert verify_token(blue_token, red_hash) is False
        assert verify_token(blue_token, spec_hash) is False

        assert verify_token(red_token, red_hash) is True
        assert verify_token(red_token, blue_hash) is False

        assert verify_token(spec_token, spec_hash) is True
        assert verify_token(spec_token, blue_hash) is False
