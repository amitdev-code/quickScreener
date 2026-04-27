from enum import Enum

from fastapi import Depends


class Permission(str, Enum):
    # Job
    JOB_CREATE = "JOB_CREATE"
    JOB_READ = "JOB_READ"
    JOB_UPDATE = "JOB_UPDATE"
    JOB_DELETE = "JOB_DELETE"
    JOB_PUBLISH = "JOB_PUBLISH"
    # Candidate
    CANDIDATE_READ = "CANDIDATE_READ"
    CANDIDATE_CREATE = "CANDIDATE_CREATE"
    CANDIDATE_DELETE = "CANDIDATE_DELETE"
    CANDIDATE_EXPORT = "CANDIDATE_EXPORT"
    # Interview
    INTERVIEW_LINK_GENERATE = "INTERVIEW_LINK_GENERATE"
    INTERVIEW_WATCH_LIVE = "INTERVIEW_WATCH_LIVE"
    INTERVIEW_INJECT_QUESTION = "INTERVIEW_INJECT_QUESTION"
    INTERVIEW_TERMINATE = "INTERVIEW_TERMINATE"
    INTERVIEW_REPORT_READ = "INTERVIEW_REPORT_READ"
    INTERVIEW_REPORT_EXPORT = "INTERVIEW_REPORT_EXPORT"
    # Screening
    SCREENER_RUN = "SCREENER_RUN"
    SCREENER_CONFIGURE = "SCREENER_CONFIGURE"
    # CRM
    CRM_PIPELINE_READ = "CRM_PIPELINE_READ"
    CRM_PIPELINE_WRITE = "CRM_PIPELINE_WRITE"
    CRM_OFFER_CREATE = "CRM_OFFER_CREATE"
    CRM_OFFER_APPROVE = "CRM_OFFER_APPROVE"
    CRM_ANALYTICS_READ = "CRM_ANALYTICS_READ"
    # Tenant / admin
    TENANT_SETTINGS_READ = "TENANT_SETTINGS_READ"
    TENANT_SETTINGS_WRITE = "TENANT_SETTINGS_WRITE"
    TEAM_MEMBER_INVITE = "TEAM_MEMBER_INVITE"
    TEAM_MEMBER_REMOVE = "TEAM_MEMBER_REMOVE"
    INTEGRATION_CONFIGURE = "INTEGRATION_CONFIGURE"
    BILLING_READ = "BILLING_READ"
    BILLING_WRITE = "BILLING_WRITE"
    # Score release
    SCORE_RELEASE_TO_CANDIDATE = "SCORE_RELEASE_TO_CANDIDATE"


_ALL_PERMISSIONS: set[Permission] = set(Permission)

# fmt: off
ROLE_PERMISSIONS: dict[str, set[Permission]] = {
    "SUPER_ADMIN": _ALL_PERMISSIONS,
    "HR_MANAGER": _ALL_PERMISSIONS - {
        Permission.BILLING_WRITE,
        Permission.TENANT_SETTINGS_WRITE,
    },
    "RECRUITER": {
        Permission.JOB_CREATE, Permission.JOB_READ,
        Permission.JOB_UPDATE, Permission.JOB_PUBLISH,
        Permission.CANDIDATE_READ, Permission.CANDIDATE_CREATE,
        Permission.INTERVIEW_LINK_GENERATE, Permission.INTERVIEW_WATCH_LIVE,
        Permission.INTERVIEW_INJECT_QUESTION, Permission.INTERVIEW_TERMINATE,
        Permission.INTERVIEW_REPORT_READ,
        Permission.SCREENER_RUN,
        Permission.CRM_PIPELINE_READ, Permission.CRM_PIPELINE_WRITE,
        Permission.CRM_OFFER_CREATE,
        Permission.TENANT_SETTINGS_READ,
    },
    "VIEWER": {
        Permission.JOB_READ,
        Permission.CANDIDATE_READ,
        Permission.INTERVIEW_REPORT_READ,
        Permission.CRM_PIPELINE_READ,
        Permission.CRM_ANALYTICS_READ,
        Permission.TENANT_SETTINGS_READ,
    },
}
# fmt: on


def has_permission(role: str, permission: Permission) -> bool:
    raise NotImplementedError


def require_permission(permission: Permission) -> Depends:
    raise NotImplementedError


def get_user_permissions(role: str) -> set[Permission]:
    raise NotImplementedError
