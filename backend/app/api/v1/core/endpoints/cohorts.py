from app.api.v1.core.models import User
from app.api.v1.core.schemas import (
    CohortCreateSchema,
    CohortDetailSchema,
    CohortOutSchema,
    CohortUpdateSchema,
    EnrollmentOutSchema,
    EnrollStudentSchema,
)
from app.api.v1.core.services import (
    create_cohort,
    delete_cohort,
    enroll_student,
    get_cohort_detail,
    list_cohort_students,
    list_program_cohorts,
    update_cohort,
)
from app.db_setup import get_db
from app.security import get_current_admin, get_current_staff, get_current_user
from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

# Cohorts nested under programs
router = APIRouter(tags=["cohorts"], prefix="/programs")


@router.get("/{program_id}/cohorts", response_model=list[CohortOutSchema])
def list_cohorts(
    program_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return list_program_cohorts(db, program_id)


@router.post(
    "/{program_id}/cohorts",
    response_model=CohortOutSchema,
    status_code=status.HTTP_201_CREATED,
)
def create_cohort_endpoint(
    program_id: int,
    data: CohortCreateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    return create_cohort(db, program_id, data)


# Direct cohort access
cohort_router = APIRouter(tags=["cohorts"], prefix="/cohorts")


@cohort_router.get("/{cohort_id}", response_model=CohortDetailSchema)
def get_cohort(
    cohort_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_cohort_detail(db, cohort_id)


@cohort_router.put("/{cohort_id}", response_model=CohortOutSchema)
def update_cohort_endpoint(
    cohort_id: int,
    data: CohortUpdateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    return update_cohort(db, cohort_id, data)


@cohort_router.delete("/{cohort_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_cohort_endpoint(
    cohort_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    delete_cohort(db, cohort_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@cohort_router.post(
    "/{cohort_id}/enroll",
    response_model=EnrollmentOutSchema,
    status_code=status.HTTP_201_CREATED,
)
def enroll_student_endpoint(
    cohort_id: int,
    data: EnrollStudentSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_staff),
):
    return enroll_student(db, cohort_id, data.student_id)


@cohort_router.get("/{cohort_id}/students", response_model=list[EnrollmentOutSchema])
def list_enrolled_students(
    cohort_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_staff),
):
    return list_cohort_students(db, cohort_id)
