import secrets

import bcrypt


def generate_token() -> str:
    """256 bits of entropy. Cryptographically secure."""
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    """Hash for storage. Never store raw tokens."""
    return bcrypt.hashpw(token.encode(), bcrypt.gensalt(rounds=12)).decode()


def verify_token(token: str, token_hash: str) -> bool:
    """Constant-time comparison via bcrypt."""
    return bcrypt.checkpw(token.encode(), token_hash.encode())
