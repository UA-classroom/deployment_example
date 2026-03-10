from datetime import date, datetime, timezone
from typing import Optional

from sqlalchemy import (
    Boolean,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)


class Token(Base):
    __tablename__ = "tokens"

    created: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc)
    )
    token: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    user: Mapped["User"] = relationship(back_populates="tokens")


class Role(Base):
    __tablename__ = "roles"

    name: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)

    users: Mapped[list["User"]] = relationship(back_populates="role_ref")

    def __repr__(self) -> str:
        return f"<Role {self.name}>"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    first_name: Mapped[str] = mapped_column(String(100), index=True)
    last_name: Mapped[str] = mapped_column(String(100), index=True)
    disabled: Mapped[bool] = mapped_column(Boolean, default=False)
    hashed_password: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(
        server_default=func.now()
    )

    # Auth
    role_id: Mapped[int] = mapped_column(
        ForeignKey("roles.id"), index=True
    )
    role_ref: Mapped["Role"] = relationship(back_populates="users")
    tokens: Mapped[list["Token"]] = relationship(back_populates="user")
    led_programs: Mapped[list["Program"]] = relationship(back_populates="leader")
    enrollments: Mapped[list["StudentEnrollment"]] = relationship(
        back_populates="student", foreign_keys="[StudentEnrollment.student_id]"
    )
    grades: Mapped[list["Grade"]] = relationship(
        back_populates="student", foreign_keys="[Grade.student_id]"
    )

    @property
    def role(self) -> str:
        return self.role_ref.name

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"

    def __repr__(self) -> str:
        return f"<User {self.email} ({self.full_name})>"


class Program(Base):
    __tablename__ = "programs"

    name: Mapped[str] = mapped_column(String(200), index=True)
    code: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    yh_points: Mapped[int] = mapped_column(Integer)
    duration_weeks: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(
        String(20), default="draft", index=True
    )
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    leader_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )

    leader: Mapped[Optional["User"]] = relationship(back_populates="led_programs")
    courses: Mapped[list["Course"]] = relationship(
        back_populates="program", cascade="all, delete-orphan"
    )
    cohorts: Mapped[list["Cohort"]] = relationship(
        back_populates="program", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Program {self.code} ({self.name})>"


class Course(Base):
    __tablename__ = "courses"
    __table_args__ = (Index("ix_courses_program_sort", "program_id", "sort_order"),)

    name: Mapped[str] = mapped_column(String(200))
    code: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    yh_points: Mapped[int] = mapped_column(Integer)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    course_type: Mapped[str] = mapped_column(String(20), default="regular")
    program_id: Mapped[int] = mapped_column(
        ForeignKey("programs.id", ondelete="CASCADE"), index=True
    )

    program: Mapped["Program"] = relationship(back_populates="courses")
    grades: Mapped[list["Grade"]] = relationship(
        back_populates="course", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Course {self.code} ({self.name})>"


class Cohort(Base):
    __tablename__ = "cohorts"

    program_id: Mapped[int] = mapped_column(
        ForeignKey("programs.id", ondelete="CASCADE"), index=True
    )
    cohort_code: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    start_date: Mapped[date] = mapped_column()
    end_date: Mapped[date] = mapped_column()
    status: Mapped[str] = mapped_column(String(20), default="planned", index=True)
    study_pace: Mapped[int] = mapped_column(Integer, default=100)
    max_seats: Mapped[int] = mapped_column(Integer)

    program: Mapped["Program"] = relationship(back_populates="cohorts")
    enrollments: Mapped[list["StudentEnrollment"]] = relationship(
        back_populates="cohort", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Cohort {self.cohort_code}>"


class StudentEnrollment(Base):
    __tablename__ = "student_enrollments"
    __table_args__ = (
        UniqueConstraint("student_id", "cohort_id", name="uq_student_cohort"),
    )

    student_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    cohort_id: Mapped[int] = mapped_column(
        ForeignKey("cohorts.id", ondelete="CASCADE"), index=True
    )
    enrollment_date: Mapped[date] = mapped_column()
    status: Mapped[str] = mapped_column(String(20), default="active", index=True)
    graduation_date: Mapped[Optional[date]] = mapped_column(nullable=True)

    student: Mapped["User"] = relationship(back_populates="enrollments")
    cohort: Mapped["Cohort"] = relationship(back_populates="enrollments")

    def __repr__(self) -> str:
        return f"<Enrollment student={self.student_id} cohort={self.cohort_id}>"


class Grade(Base):
    __tablename__ = "grades"

    student_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    course_id: Mapped[int] = mapped_column(
        ForeignKey("courses.id", ondelete="CASCADE"), index=True
    )
    grade: Mapped[str] = mapped_column(String(5))
    graded_by: Mapped[int] = mapped_column(ForeignKey("users.id"))
    graded_at: Mapped[datetime] = mapped_column(server_default=func.now())
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_reexamination: Mapped[bool] = mapped_column(Boolean, default=False)

    student: Mapped["User"] = relationship(
        foreign_keys=[student_id], back_populates="grades"
    )
    grader: Mapped["User"] = relationship(foreign_keys=[graded_by])
    course: Mapped["Course"] = relationship(back_populates="grades")

    def __repr__(self) -> str:
        return f"<Grade student={self.student_id} course={self.course_id} grade={self.grade}>"
