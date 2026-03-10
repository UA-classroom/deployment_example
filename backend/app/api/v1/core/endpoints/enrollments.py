from app.api.v1.core.models import User
from app.api.v1.core.schemas import EnrollmentOutSchema, EnrollmentStatusUpdateSchema
from app.api.v1.core.services import update_enrollment_status
from app.db_setup import get_db
from app.security import get_current_staff
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

router = APIRouter(tags=["enrollments"], prefix="/enrollments")


@router.put("/{enrollment_id}/status", response_model=EnrollmentOutSchema)
def update_enrollment_status_endpoint(
    enrollment_id: int,
    data: EnrollmentStatusUpdateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_staff),
):
    return update_enrollment_status(db, enrollment_id, data)
