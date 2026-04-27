from datetime import datetime
from uuid import UUID

from sqlalchemy import Boolean, DateTime, Enum, Index, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Tenant(Base):
    __tablename__ = "tenants"

    id: Mapped[UUID] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    subdomain: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    plan: Mapped[str] = mapped_column(
        Enum("GROWTH", "PROFESSIONAL", "ENTERPRISE", name="plan_enum"),
        nullable=False,
    )
    config: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    # config shape:
    # {
    #   white_label: { logo_url, primary_color, email_sender },
    #   interview: { max_duration_mins, proctor_policy, score_visibility },
    #   auth: { require_mfa, session_ttl_hours },
    #   ai: { llm_provider, tts_voice_id, stt_language },
    #   retention: { reports_days, recordings_days, transcripts_days }
    # }
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    users: Mapped[list["User"]] = relationship(back_populates="tenant")

    __table_args__ = (Index("ix_tenants_subdomain", "subdomain", unique=True),)
