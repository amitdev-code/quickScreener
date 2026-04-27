from app.core.permissions import Permission
from app.core.rbac import UserContext
from app.core.security import InterviewLinkPayload


async def authenticate_socket(sid: str, environ: dict, auth: dict) -> UserContext:
    raise NotImplementedError


async def get_socket_user(sid: str, namespace: str) -> UserContext:
    raise NotImplementedError


async def socket_require_permission(
    sid: str, namespace: str, permission: Permission
) -> None:
    raise NotImplementedError


async def authenticate_interview_link(
    sid: str, environ: dict, auth: dict
) -> InterviewLinkPayload:
    raise NotImplementedError
