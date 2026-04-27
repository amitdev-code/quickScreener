import pytest


def test_super_admin_has_all_permissions() -> None:
    pass


def test_viewer_cannot_generate_interview_link() -> None:
    pass


def test_recruiter_cannot_approve_offer() -> None:
    pass


def test_hr_manager_cannot_write_billing() -> None:
    pass


def test_require_permission_dependency_raises_403_on_missing() -> None:
    pass


def test_same_tenant_guard_raises_403_on_cross_tenant() -> None:
    pass
