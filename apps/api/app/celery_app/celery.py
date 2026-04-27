from celery import Celery

from app.celery_app.beat_schedule import beat_schedule

celery_app = Celery(
    "aiscreener",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/1",
    include=["app.celery_app.tasks.auth_tasks"],
)

celery_app.conf.beat_schedule = beat_schedule
celery_app.conf.timezone = "UTC"
