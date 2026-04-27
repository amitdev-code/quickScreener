from app.celery_app.celery import celery_app


@celery_app.task(name="auth.cleanup_expired_sessions")
def cleanup_expired_sessions() -> None:
    raise NotImplementedError


@celery_app.task(name="auth.send_mfa_backup_codes_email")
def send_mfa_backup_codes_email(user_id: str) -> None:
    raise NotImplementedError


@celery_app.task(name="auth.send_password_reset_email")
def send_password_reset_email(user_id: str, reset_token: str) -> None:
    raise NotImplementedError
