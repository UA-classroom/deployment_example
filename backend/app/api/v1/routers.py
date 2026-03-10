from app.api.v1.core.endpoints.authentication import router as auth_router
from app.api.v1.core.endpoints.cohorts import cohort_router, router as cohort_nested_router
from app.api.v1.core.endpoints.enrollments import router as enrollment_router
from app.api.v1.core.endpoints.general import router as general_router
from app.api.v1.core.endpoints.grades import (
    grade_router,
    router as grade_nested_router,
    student_router,
)
from app.api.v1.core.endpoints.programs import course_router, router as programs_router
from fastapi import APIRouter

router = APIRouter()

router.include_router(auth_router)
router.include_router(general_router)
router.include_router(programs_router)
router.include_router(course_router)
router.include_router(cohort_nested_router)
router.include_router(cohort_router)
router.include_router(enrollment_router)
router.include_router(grade_nested_router)
router.include_router(grade_router)
router.include_router(student_router)
