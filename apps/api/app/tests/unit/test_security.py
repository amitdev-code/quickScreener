import pytest


def test_create_access_token_returns_valid_jwt() -> None:
    pass


def test_decode_access_token_with_expired_token_raises() -> None:
    pass


def test_decode_access_token_with_wrong_key_raises() -> None:
    pass


def test_token_version_mismatch_raises() -> None:
    pass


def test_jti_blacklist_blocks_token() -> None:
    pass


def test_interview_link_nonce_consumed_on_first_use() -> None:
    pass


def test_interview_link_nonce_rejected_on_second_use() -> None:
    pass


def test_hash_password_and_verify() -> None:
    pass


def test_verify_password_wrong_password_returns_false() -> None:
    pass
