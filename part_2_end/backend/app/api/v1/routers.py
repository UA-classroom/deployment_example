from app.api.v1.core.endpoints.authentication import router as auth_router
from app.api.v1.core.endpoints.general import router as general_router
from fastapi import APIRouter

router = APIRouter()

router.include_router(general_router)
router.include_router(auth_router)
