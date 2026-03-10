from app.api.v1.core.models import Program, User
from app.api.v1.core.schemas import (
    CourseCreateSchema,
    CourseOutSchema,
    CourseUpdateSchema,
    ProgramCreateSchema,
    ProgramDetailSchema,
    ProgramOutSchema,
    ProgramUpdateSchema,
    UserOutSchema,
)
from app.api.v1.core.services import (
    assign_program_leader,
    create_course,
    create_program,
    delete_course,
    delete_program,
    get_program_detail,
    update_course,
    update_program,
)
from app.db_setup import get_db
from app.security import get_current_admin, get_current_staff, get_current_user
from fastapi import APIRouter, Depends, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

router = APIRouter(tags=["programs"], prefix="/programs")


@router.get("", response_model=list[ProgramOutSchema])
def list_programs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    programs = db.scalars(select(Program).order_by(Program.name)).all()
    return programs


@router.post("", response_model=ProgramOutSchema, status_code=status.HTTP_201_CREATED)
def create_program_endpoint(
    data: ProgramCreateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    return create_program(db, data)


@router.get("/{program_id}", response_model=ProgramDetailSchema)
def get_program(
    program_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_program_detail(db, program_id)


@router.put("/{program_id}", response_model=ProgramOutSchema)
def update_program_endpoint(
    program_id: int,
    data: ProgramUpdateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    return update_program(db, program_id, data)


@router.delete("/{program_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_program_endpoint(
    program_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    delete_program(db, program_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.put("/{program_id}/leader", response_model=ProgramOutSchema)
def set_program_leader(
    program_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    return assign_program_leader(db, program_id, user_id)


# --- Courses nested under programs ---

@router.get("/{program_id}/courses", response_model=list[CourseOutSchema])
def list_program_courses(
    program_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    program = get_program_detail(db, program_id)
    return program.courses


@router.post(
    "/{program_id}/courses",
    response_model=CourseOutSchema,
    status_code=status.HTTP_201_CREATED,
)
def create_course_endpoint(
    program_id: int,
    data: CourseCreateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_staff),
):
    return create_course(db, program_id, data)


# --- Course direct endpoints (for update/delete by course id) ---

course_router = APIRouter(tags=["courses"], prefix="/courses")


@course_router.put("/{course_id}", response_model=CourseOutSchema)
def update_course_endpoint(
    course_id: int,
    data: CourseUpdateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_staff),
):
    return update_course(db, course_id, data)


@course_router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course_endpoint(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    delete_course(db, course_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
