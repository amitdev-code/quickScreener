from celery.schedules import crontab

beat_schedule = {
    "cleanup-expired-sessions": {
        "task": "auth.cleanup_expired_sessions",
        "schedule": crontab(hour=0, minute=0),  # daily at midnight UTC
    },
}
