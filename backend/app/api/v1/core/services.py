from datetime import date

from app.api.v1.core.models import Cohort, Course, Grade, Program, Role, StudentEnrollment, Token, User
from app.api.v1.core.schemas import (
    AdminPasswordResetSchema,
    AdminUserCreateSchema,
    AdminUserUpdateSchema,
    CohortCreateSchema,
    CohortUpdateSchema,
    CourseCreateSchema,
    CourseUpdateSchema,
    EnrollmentStatusUpdateSchema,
    GradeCreateSchema,
    GradeUpdateSchema,
    ProgramCreateSchema,
    ProgramUpdateSchema,
)
from app.security import hash_password
from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

VALID_PROGRAM_STATUSES = ("draft", "active", "completed", "archived")
VALID_COHORT_STATUSES = ("planned", "active", "completed")
VALID_ENROLLMENT_STATUSES = ("active", "on_leave", "graduated", "dropped_out")
VALID_GRADES = ("IG", "G", "VG")


# --- Role ---

def get_role_by_name(db: Session, name: str) -> Role:
    role = db.scalars(select(Role).where(Role.name == name)).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role '{name}' not found",
        )
    return role


def get_role_by_id(db: Session, role_id: int) -> Role:
    role = db.scalars(select(Role).where(Role.id == role_id)).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role with ID {role_id} not found",
        )
    return role


def list_roles(db: Session) -> list[Role]:
    return list(db.scalars(select(Role)).all())


# --- User (admin) ---

def create_user_as_admin(db: Session, data: AdminUserCreateSchema) -> User:
    role = get_role_by_id(db, data.role_id)
    hashed = hash_password(data.password)
    user = User(
        email=data.email,
        first_name=data.first_name,
        last_name=data.last_name,
        hashed_password=hashed,
        role_id=role.id,
    )
    db.add(user)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists",
        )
    db.refresh(user)
    return user


def update_user_role(db: Session, user_id: int, role_id: int) -> User:
    user = db.scalars(select(User).where(User.id == user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found",
        )
    role = get_role_by_id(db, role_id)
    user.role_id = role.id
    db.commit()
    db.refresh(user)
    return user


def admin_update_user(db: Session, user_id: int, data: AdminUserUpdateSchema) -> User:
    user = db.scalars(select(User).where(User.id == user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found",
        )

    update_data = data.model_dump(exclude_unset=True)

    if "email" in update_data:
        existing = db.scalars(
            select(User).where(User.email == update_data["email"], User.id != user_id)
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A user with this email already exists",
            )

    for key, value in update_data.items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)
    return user


def admin_reset_password(db: Session, user_id: int, data: AdminPasswordResetSchema) -> User:
    user = db.scalars(select(User).where(User.id == user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found",
        )

    user.hashed_password = hash_password(data.new_password)

    # Invalidate all existing tokens so user must re-login
    db.execute(select(Token).where(Token.user_id == user_id))
    tokens = db.scalars(select(Token).where(Token.user_id == user_id)).all()
    for token in tokens:
        db.delete(token)

    db.commit()
    db.refresh(user)
    return user


def toggle_user_status(db: Session, user_id: int) -> User:
    user = db.scalars(select(User).where(User.id == user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found",
        )

    user.disabled = not user.disabled

    # If disabling, invalidate all tokens
    if user.disabled:
        tokens = db.scalars(select(Token).where(Token.user_id == user_id)).all()
        for token in tokens:
            db.delete(token)

    db.commit()
    db.refresh(user)
    return user


# --- Program ---

def create_program(db: Session, data: ProgramCreateSchema) -> Program:
    existing = db.scalars(
        select(Program).where(Program.code == data.code)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Program with code '{data.code}' already exists",
        )
    if data.leader_id:
        leader = db.scalars(
            select(User).where(User.id == data.leader_id)
        ).first()
        if not leader or leader.role != "utbildningsledare":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Leader must be a user with the utbildningsledare role",
            )

    program = Program(**data.model_dump())
    db.add(program)
    db.commit()
    db.refresh(program)
    return program


def update_program(db: Session, program_id: int, data: ProgramUpdateSchema) -> Program:
    program = db.scalars(
        select(Program).where(Program.id == program_id)
    ).first()
    if not program:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Program with ID {program_id} not found",
        )

    update_data = data.model_dump(exclude_unset=True)

    if "status" in update_data and update_data["status"] not in VALID_PROGRAM_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(VALID_PROGRAM_STATUSES)}",
        )

    if "leader_id" in update_data and update_data["leader_id"] is not None:
        leader = db.scalars(
            select(User).where(User.id == update_data["leader_id"])
        ).first()
        if not leader or leader.role != "utbildningsledare":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Leader must be a user with the utbildningsledare role",
            )

    for key, value in update_data.items():
        setattr(program, key, value)

    db.commit()
    db.refresh(program)
    return program


def delete_program(db: Session, program_id: int) -> None:
    program = db.scalars(
        select(Program).where(Program.id == program_id)
    ).first()
    if not program:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Program with ID {program_id} not found",
        )
    db.delete(program)
    db.commit()


def get_program_detail(db: Session, program_id: int) -> Program:
    program = db.scalars(
        select(Program).where(Program.id == program_id)
    ).first()
    if not program:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Program with ID {program_id} not found",
        )
    return program


def assign_program_leader(db: Session, program_id: int, user_id: int) -> Program:
    program = db.scalars(
        select(Program).where(Program.id == program_id)
    ).first()
    if not program:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Program with ID {program_id} not found",
        )
    leader = db.scalars(select(User).where(User.id == user_id)).first()
    if not leader or leader.role != "utbildningsledare":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Leader must be a user with the utbildningsledare role",
        )
    program.leader_id = leader.id
    db.commit()
    db.refresh(program)
    return program


# --- Course ---

def create_course(db: Session, program_id: int, data: CourseCreateSchema) -> Course:
    program = db.scalars(
        select(Program).where(Program.id == program_id)
    ).first()
    if not program:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Program with ID {program_id} not found",
        )
    existing = db.scalars(
        select(Course).where(Course.code == data.code)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Course with code '{data.code}' already exists",
        )

    course = Course(program_id=program_id, **data.model_dump())
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


def update_course(db: Session, course_id: int, data: CourseUpdateSchema) -> Course:
    course = db.scalars(
        select(Course).where(Course.id == course_id)
    ).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Course with ID {course_id} not found",
        )

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(course, key, value)

    db.commit()
    db.refresh(course)
    return course


def delete_course(db: Session, course_id: int) -> None:
    course = db.scalars(
        select(Course).where(Course.id == course_id)
    ).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Course with ID {course_id} not found",
        )
    db.delete(course)
    db.commit()


# --- Cohort ---

def create_cohort(db: Session, program_id: int, data: CohortCreateSchema) -> Cohort:
    program = db.scalars(
        select(Program).where(Program.id == program_id)
    ).first()
    if not program:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Program with ID {program_id} not found",
        )
    existing = db.scalars(
        select(Cohort).where(Cohort.cohort_code == data.cohort_code)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cohort with code '{data.cohort_code}' already exists",
        )

    cohort = Cohort(program_id=program_id, **data.model_dump())
    db.add(cohort)
    db.commit()
    db.refresh(cohort)
    return cohort


def update_cohort(db: Session, cohort_id: int, data: CohortUpdateSchema) -> Cohort:
    cohort = db.scalars(
        select(Cohort).where(Cohort.id == cohort_id)
    ).first()
    if not cohort:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cohort with ID {cohort_id} not found",
        )

    update_data = data.model_dump(exclude_unset=True)

    if "status" in update_data and update_data["status"] not in VALID_COHORT_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(VALID_COHORT_STATUSES)}",
        )

    if "cohort_code" in update_data:
        existing = db.scalars(
            select(Cohort).where(
                Cohort.cohort_code == update_data["cohort_code"],
                Cohort.id != cohort_id,
            )
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Cohort with code '{update_data['cohort_code']}' already exists",
            )

    for key, value in update_data.items():
        setattr(cohort, key, value)

    db.commit()
    db.refresh(cohort)
    return cohort


def delete_cohort(db: Session, cohort_id: int) -> None:
    cohort = db.scalars(
        select(Cohort).where(Cohort.id == cohort_id)
    ).first()
    if not cohort:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cohort with ID {cohort_id} not found",
        )
    db.delete(cohort)
    db.commit()


def get_cohort_detail(db: Session, cohort_id: int) -> Cohort:
    cohort = db.scalars(
        select(Cohort).where(Cohort.id == cohort_id)
    ).first()
    if not cohort:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cohort with ID {cohort_id} not found",
        )
    return cohort


def list_program_cohorts(db: Session, program_id: int) -> list[Cohort]:
    program = db.scalars(
        select(Program).where(Program.id == program_id)
    ).first()
    if not program:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Program with ID {program_id} not found",
        )
    return list(db.scalars(
        select(Cohort).where(Cohort.program_id == program_id)
    ).all())


# --- Enrollment ---

def enroll_student(db: Session, cohort_id: int, student_id: int) -> StudentEnrollment:
    cohort = db.scalars(
        select(Cohort).where(Cohort.id == cohort_id)
    ).first()
    if not cohort:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cohort with ID {cohort_id} not found",
        )

    student = db.scalars(
        select(User).where(User.id == student_id)
    ).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {student_id} not found",
        )
    if student.role != "student":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only users with the student role can be enrolled",
        )

    existing = db.scalars(
        select(StudentEnrollment).where(
            StudentEnrollment.student_id == student_id,
            StudentEnrollment.cohort_id == cohort_id,
        )
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Student is already enrolled in this cohort",
        )

    active_count = db.scalar(
        select(func.count()).select_from(StudentEnrollment).where(
            StudentEnrollment.cohort_id == cohort_id,
            StudentEnrollment.status == "active",
        )
    )
    if active_count >= cohort.max_seats:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cohort has reached maximum capacity",
        )

    enrollment = StudentEnrollment(
        student_id=student_id,
        cohort_id=cohort_id,
        enrollment_date=date.today(),
    )
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return enrollment


def list_cohort_students(db: Session, cohort_id: int) -> list[StudentEnrollment]:
    cohort = db.scalars(
        select(Cohort).where(Cohort.id == cohort_id)
    ).first()
    if not cohort:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cohort with ID {cohort_id} not found",
        )
    return list(db.scalars(
        select(StudentEnrollment).where(StudentEnrollment.cohort_id == cohort_id)
    ).all())


def update_enrollment_status(
    db: Session, enrollment_id: int, data: EnrollmentStatusUpdateSchema
) -> StudentEnrollment:
    enrollment = db.scalars(
        select(StudentEnrollment).where(StudentEnrollment.id == enrollment_id)
    ).first()
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Enrollment with ID {enrollment_id} not found",
        )

    if data.status not in VALID_ENROLLMENT_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(VALID_ENROLLMENT_STATUSES)}",
        )

    enrollment.status = data.status

    if data.status == "graduated":
        enrollment.graduation_date = data.graduation_date or date.today()
    elif data.graduation_date:
        enrollment.graduation_date = data.graduation_date

    db.commit()
    db.refresh(enrollment)
    return enrollment


def get_student_enrollments(db: Session, student_id: int) -> list[StudentEnrollment]:
    return list(db.scalars(
        select(StudentEnrollment).where(StudentEnrollment.student_id == student_id)
    ).all())


# --- Grade ---

def create_grade(
    db: Session, course_id: int, data: GradeCreateSchema, graded_by_id: int
) -> Grade:
    course = db.scalars(
        select(Course).where(Course.id == course_id)
    ).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Course with ID {course_id} not found",
        )

    student = db.scalars(
        select(User).where(User.id == data.student_id)
    ).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {data.student_id} not found",
        )

    grade = Grade(
        student_id=data.student_id,
        course_id=course_id,
        grade=data.grade,
        graded_by=graded_by_id,
        notes=data.notes,
        is_reexamination=data.is_reexamination,
    )
    db.add(grade)
    db.commit()
    db.refresh(grade)
    return grade


def list_course_grades(db: Session, course_id: int) -> list[Grade]:
    course = db.scalars(
        select(Course).where(Course.id == course_id)
    ).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Course with ID {course_id} not found",
        )
    return list(db.scalars(
        select(Grade).where(Grade.course_id == course_id)
    ).all())


def get_student_grades(db: Session, student_id: int) -> list[Grade]:
    return list(db.scalars(
        select(Grade).where(Grade.student_id == student_id)
    ).all())


def update_grade(
    db: Session, grade_id: int, data: GradeUpdateSchema, graded_by_id: int
) -> Grade:
    grade = db.scalars(
        select(Grade).where(Grade.id == grade_id)
    ).first()
    if not grade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Grade with ID {grade_id} not found",
        )

    update_data = data.model_dump(exclude_unset=True)

    if "grade" in update_data and update_data["grade"] not in VALID_GRADES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid grade. Must be one of: {', '.join(VALID_GRADES)}",
        )

    for key, value in update_data.items():
        setattr(grade, key, value)

    grade.graded_by = graded_by_id
    grade.graded_at = func.now()

    db.commit()
    db.refresh(grade)
    return grade