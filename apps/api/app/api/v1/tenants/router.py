from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.repositories.tenant import TenantRepository

router = APIRouter(prefix="/tenants", tags=["tenants"])


class TenantResolveResponse(BaseModel):
    tenant_id: str


@router.get("/resolve", response_model=TenantResolveResponse)
async def resolve_tenant(
    subdomain: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_db),
) -> TenantResolveResponse:
    tenant = await TenantRepository(db).get_by_subdomain(subdomain)
    if not tenant or not tenant.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found",
        )
    return TenantResolveResponse(tenant_id=str(tenant.id))
