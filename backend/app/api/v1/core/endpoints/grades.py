from app.api.v1.core.models import User
from app.api.v1.core.schemas import (
    EnrollmentOutSchema,
    GradeCreateSchema,
    GradeOutSchema,
    GradeUpdateSchema,
)
from app.api.v1.core.services import (
    create_grade,
    get_student_enrollments,
    get_student_grades,
    list_course_grades,
    update_grade,
)
from app.db_setup import get_db
from app.security import get_current_staff, get_current_user
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

# Grades nested under courses
router = APIRouter(tags=["grades"], prefix="/courses")


@router.post(
    "/{course_id}/grades",
    response_model=GradeOutSchema,
    status_code=status.HTTP_201_CREATED,
)
def create_grade_endpoint(
    course_id: int,
    data: GradeCreateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_staff),
):
    return create_grade(db, course_id, data, current_user.id)


@router.get("/{course_id}/grades", response_model=list[GradeOutSchema])
def list_grades_for_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_staff),
):
    return list_course_grades(db, course_id)


# Grade update (flat)
grade_router = APIRouter(tags=["grades"], prefix="/grades")


@grade_router.put("/{grade_id}", response_model=GradeOutSchema)
def update_grade_endpoint(
    grade_id: int,
    data: GradeUpdateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_staff),
):
    return update_grade(db, grade_id, data, current_user.id)


# Student grades and enrollments (staff or self)
student_router = APIRouter(tags=["students"], prefix="/students")


def _require_staff_or_self(student_id: int, current_user: User) -> None:
    if current_user.role in ("admin", "utbildningsledare"):
        return
    if current_user.id == student_id:
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Access denied",
    )


@student_router.get("/{student_id}/grades", response_model=list[GradeOutSchema])
def get_student_grades_endpoint(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_staff_or_self(student_id, current_user)
    return get_student_grades(db, student_id)


@student_router.get(
    "/{student_id}/enrollments", response_model=list[EnrollmentOutSchema]
)
def get_student_enrollments_endpoint(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_staff_or_self(student_id, current_user)
    return get_student_enrollments(db, student_id)
