from datetime import date, datetime
from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict, EmailStr, Field

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
    total_pages: int


# --- Auth / Token ---

class TokenSchema(BaseModel):
    access_token: str
    token_type: str


# --- Role ---

class RoleOutSchema(BaseModel):
    id: int
    name: str
    description: str | None = None
    model_config = ConfigDict(from_attributes=True)


# --- User ---

class AdminUserCreateSchema(BaseModel):
    email: EmailStr
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=8)
    role_id: int


class UserOutSchema(BaseModel):
    id: int
    email: str
    last_name: str
    first_name: str
    role: str
    model_config = ConfigDict(from_attributes=True)


class UserSchema(BaseModel):
    id: int
    email: EmailStr
    first_name: str
    last_name: str
    role: str
    disabled: bool = False
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class UserUpdateSchema(BaseModel):
    first_name: str | None = Field(min_length=1)
    last_name: str | None = Field(min_length=1)
    email: EmailStr | None = None
    model_config = ConfigDict(from_attributes=True)


class UserRoleUpdateSchema(BaseModel):
    role_id: int


class PasswordChangeSchema(BaseModel):
    current_password: str
    new_password: str


class AdminUserUpdateSchema(BaseModel):
    first_name: str | None = Field(None, min_length=1, max_length=100)
    last_name: str | None = Field(None, min_length=1, max_length=100)
    email: EmailStr | None = None


class AdminPasswordResetSchema(BaseModel):
    new_password: str = Field(min_length=8)


# --- Program ---

class ProgramCreateSchema(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    code: str = Field(min_length=1, max_length=20, description="e.g. SUVNET26")
    description: str | None = None
    yh_points: int = Field(default=400, gt=0, description="Total YH-poäng (standard 2-year = 400)")
    duration_weeks: int = Field(default=80, gt=0, description="Program duration in weeks (standard 2-year = 80)")
    leader_id: int | None = None


class ProgramUpdateSchema(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=200)
    code: str | None = Field(None, min_length=1, max_length=20)
    description: str | None = None
    yh_points: int | None = Field(None, gt=0)
    duration_weeks: int | None = Field(None, gt=0)
    status: str | None = Field(None, max_length=20)
    leader_id: int | None = None


class ProgramOutSchema(BaseModel):
    id: int
    name: str
    code: str
    description: str | None
    yh_points: int
    duration_weeks: int
    status: str
    created_at: datetime
    leader_id: int | None
    model_config = ConfigDict(from_attributes=True)


class CourseOutSchema(BaseModel):
    id: int
    program_id: int
    name: str
    code: str
    description: str | None
    yh_points: int
    sort_order: int
    model_config = ConfigDict(from_attributes=True)


class ProgramDetailSchema(ProgramOutSchema):
    courses: list[CourseOutSchema] = []


# --- Course ---

class CourseCreateSchema(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    code: str = Field(min_length=1, max_length=20, description="e.g. PYTHON101")
    description: str | None = None
    yh_points: int = Field(default=20, gt=0, description="YH-poäng for this course (typical: 15-45)")
    sort_order: int = Field(default=0, description="Order within the program")


class CourseUpdateSchema(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=200)
    code: str | None = Field(None, min_length=1, max_length=20)
    description: str | None = None
    yh_points: int | None = Field(None, gt=0)
    sort_order: int | None = None


# --- Cohort ---

class CohortCreateSchema(BaseModel):
    cohort_code: str = Field(min_length=1, max_length=20, description="e.g. SUVNET24")
    start_date: date
    end_date: date
    study_pace: int = Field(default=100, gt=0, le=100, description="100 = full-time, 50 = half-time")
    max_seats: int = Field(gt=0)


class CohortUpdateSchema(BaseModel):
    cohort_code: str | None = Field(None, min_length=1, max_length=20)
    start_date: date | None = None
    end_date: date | None = None
    status: str | None = Field(None, max_length=20)
    study_pace: int | None = Field(None, gt=0, le=100)
    max_seats: int | None = Field(None, gt=0)


class CohortOutSchema(BaseModel):
    id: int
    program_id: int
    cohort_code: str
    start_date: date
    end_date: date
    status: str
    study_pace: int
    max_seats: int
    model_config = ConfigDict(from_attributes=True)


class EnrollmentOutSchema(BaseModel):
    id: int
    student_id: int
    cohort_id: int
    enrollment_date: date
    status: str
    graduation_date: date | None
    student: UserOutSchema
    model_config = ConfigDict(from_attributes=True)


class CohortDetailSchema(CohortOutSchema):
    enrollments: list[EnrollmentOutSchema] = []


# --- Enrollment ---

class EnrollStudentSchema(BaseModel):
    student_id: int


class EnrollmentStatusUpdateSchema(BaseModel):
    status: str = Field(max_length=20)
    graduation_date: date | None = None


# --- Grade ---

class GradeCreateSchema(BaseModel):
    student_id: int
    grade: str = Field(pattern="^(IG|G|VG)$")
    notes: str | None = None
    is_reexamination: bool = False


class GradeUpdateSchema(BaseModel):
    grade: str | None = Field(None, pattern="^(IG|G|VG)$")
    notes: str | None = None


class GradeOutSchema(BaseModel):
    id: int
    student_id: int
    course_id: int
    grade: str
    graded_by: int
    graded_at: datetime
    notes: str | None
    is_reexamination: bool
    student: UserOutSchema
    model_config = ConfigDict(from_attributes=True)
