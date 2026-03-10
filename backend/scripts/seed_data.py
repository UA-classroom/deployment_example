"""
Data seeding script: populates the database with sample programs, courses,
users, cohorts, enrollments, and grades for development and testing.

Requires roles to exist first -- run seed_db.py before this script.

Run from backend/:
    python -m scripts.seed_data
"""

from datetime import date

from app.api.v1.core.models import Cohort, Course, Grade, Program, Role, StudentEnrollment, User
from app.db_setup import engine
from app.security import hash_password
from sqlalchemy import select
from sqlalchemy.orm import Session

DEFAULT_PASSWORD = "password123"

# ---------------------------------------------------------------------------
# Users: 2 extra admins, 5 utbildningsledare, 45 students = 52 users
# (plus the initial admin from seed_db.py)
# ---------------------------------------------------------------------------

SAMPLE_USERS = [
    # Admins
    {"email": "karl.berg@example.com", "first_name": "Karl", "last_name": "Berg", "role_name": "admin"},
    {"email": "lena.holm@example.com", "first_name": "Lena", "last_name": "Holm", "role_name": "admin"},
    # Utbildningsledare
    {"email": "anna.lindberg@example.com", "first_name": "Anna", "last_name": "Lindberg", "role_name": "utbildningsledare"},
    {"email": "erik.johansson@example.com", "first_name": "Erik", "last_name": "Johansson", "role_name": "utbildningsledare"},
    {"email": "karin.pettersson@example.com", "first_name": "Karin", "last_name": "Pettersson", "role_name": "utbildningsledare"},
    {"email": "gustav.forsberg@example.com", "first_name": "Gustav", "last_name": "Forsberg", "role_name": "utbildningsledare"},
    {"email": "helena.nystrom@example.com", "first_name": "Helena", "last_name": "Nystrom", "role_name": "utbildningsledare"},
    # Students (45)
    {"email": "maria.svensson@example.com", "first_name": "Maria", "last_name": "Svensson", "role_name": "student"},
    {"email": "oscar.nilsson@example.com", "first_name": "Oscar", "last_name": "Nilsson", "role_name": "student"},
    {"email": "sara.andersson@example.com", "first_name": "Sara", "last_name": "Andersson", "role_name": "student"},
    {"email": "johan.eriksson@example.com", "first_name": "Johan", "last_name": "Eriksson", "role_name": "student"},
    {"email": "emma.larsson@example.com", "first_name": "Emma", "last_name": "Larsson", "role_name": "student"},
    {"email": "anton.olsson@example.com", "first_name": "Anton", "last_name": "Olsson", "role_name": "student"},
    {"email": "linnea.persson@example.com", "first_name": "Linnea", "last_name": "Persson", "role_name": "student"},
    {"email": "viktor.karlsson@example.com", "first_name": "Viktor", "last_name": "Karlsson", "role_name": "student"},
    {"email": "ida.gustafsson@example.com", "first_name": "Ida", "last_name": "Gustafsson", "role_name": "student"},
    {"email": "felix.lundberg@example.com", "first_name": "Felix", "last_name": "Lundberg", "role_name": "student"},
    {"email": "hanna.lindqvist@example.com", "first_name": "Hanna", "last_name": "Lindqvist", "role_name": "student"},
    {"email": "alex.bergstrom@example.com", "first_name": "Alex", "last_name": "Bergstrom", "role_name": "student"},
    {"email": "elin.sandberg@example.com", "first_name": "Elin", "last_name": "Sandberg", "role_name": "student"},
    {"email": "lucas.nordstrom@example.com", "first_name": "Lucas", "last_name": "Nordstrom", "role_name": "student"},
    {"email": "amanda.wallin@example.com", "first_name": "Amanda", "last_name": "Wallin", "role_name": "student"},
    {"email": "simon.hedlund@example.com", "first_name": "Simon", "last_name": "Hedlund", "role_name": "student"},
    {"email": "julia.engstrom@example.com", "first_name": "Julia", "last_name": "Engstrom", "role_name": "student"},
    {"email": "daniel.fransson@example.com", "first_name": "Daniel", "last_name": "Fransson", "role_name": "student"},
    {"email": "maja.blom@example.com", "first_name": "Maja", "last_name": "Blom", "role_name": "student"},
    {"email": "william.ek@example.com", "first_name": "William", "last_name": "Ek", "role_name": "student"},
    {"email": "matilda.dahl@example.com", "first_name": "Matilda", "last_name": "Dahl", "role_name": "student"},
    {"email": "adam.lund@example.com", "first_name": "Adam", "last_name": "Lund", "role_name": "student"},
    {"email": "filippa.strand@example.com", "first_name": "Filippa", "last_name": "Strand", "role_name": "student"},
    {"email": "leo.bjork@example.com", "first_name": "Leo", "last_name": "Bjork", "role_name": "student"},
    {"email": "klara.aberg@example.com", "first_name": "Klara", "last_name": "Aberg", "role_name": "student"},
    {"email": "oliver.sjoberg@example.com", "first_name": "Oliver", "last_name": "Sjoberg", "role_name": "student"},
    {"email": "wilma.nyberg@example.com", "first_name": "Wilma", "last_name": "Nyberg", "role_name": "student"},
    {"email": "elias.holmgren@example.com", "first_name": "Elias", "last_name": "Holmgren", "role_name": "student"},
    {"email": "stella.ekstrom@example.com", "first_name": "Stella", "last_name": "Ekstrom", "role_name": "student"},
    {"email": "hugo.sundberg@example.com", "first_name": "Hugo", "last_name": "Sundberg", "role_name": "student"},
    {"email": "alva.magnusson@example.com", "first_name": "Alva", "last_name": "Magnusson", "role_name": "student"},
    {"email": "isak.nordin@example.com", "first_name": "Isak", "last_name": "Nordin", "role_name": "student"},
    {"email": "saga.hoglund@example.com", "first_name": "Saga", "last_name": "Hoglund", "role_name": "student"},
    {"email": "noel.vikstrom@example.com", "first_name": "Noel", "last_name": "Vikstrom", "role_name": "student"},
    {"email": "ebba.sjolund@example.com", "first_name": "Ebba", "last_name": "Sjolund", "role_name": "student"},
    {"email": "theo.hallberg@example.com", "first_name": "Theo", "last_name": "Hallberg", "role_name": "student"},
    {"email": "selma.moberg@example.com", "first_name": "Selma", "last_name": "Moberg", "role_name": "student"},
    {"email": "liam.askman@example.com", "first_name": "Liam", "last_name": "Askman", "role_name": "student"},
    {"email": "vera.grahn@example.com", "first_name": "Vera", "last_name": "Grahn", "role_name": "student"},
    {"email": "arvid.sjogren@example.com", "first_name": "Arvid", "last_name": "Sjogren", "role_name": "student"},
    {"email": "astrid.lilja@example.com", "first_name": "Astrid", "last_name": "Lilja", "role_name": "student"},
    {"email": "melvin.skoglund@example.com", "first_name": "Melvin", "last_name": "Skoglund", "role_name": "student"},
    {"email": "mila.hellstrom@example.com", "first_name": "Mila", "last_name": "Hellstrom", "role_name": "student"},
    {"email": "alfred.rosen@example.com", "first_name": "Alfred", "last_name": "Rosen", "role_name": "student"},
    {"email": "tuva.backman@example.com", "first_name": "Tuva", "last_name": "Backman", "role_name": "student"},
]

# ---------------------------------------------------------------------------
# Programs and Courses
# ---------------------------------------------------------------------------

SAMPLE_PROGRAMS = [
    {
        "name": "Webbutvecklare Fullstack",
        "code": "WEBFUL26",
        "description": "Utbildningen ger dig kompetens att arbeta som fullstack-webbutvecklare med moderna ramverk och verktyg.",
        "yh_points": 400,
        "duration_weeks": 80,
        "status": "active",
        "leader_email": "anna.lindberg@example.com",
        "courses": [
            {"name": "Programmering med Python", "code": "PYTHON101", "yh_points": 30, "sort_order": 1},
            {"name": "Frontend med React", "code": "REACT101", "yh_points": 40, "sort_order": 2},
            {"name": "Backend med FastAPI", "code": "FASTAPI101", "yh_points": 35, "sort_order": 3},
            {"name": "Databaser och SQL", "code": "DBSQL101", "yh_points": 25, "sort_order": 4},
            {"name": "Agila metoder", "code": "AGILE101", "yh_points": 15, "sort_order": 5},
            {"name": "LIA 1", "code": "LIA1WEB", "yh_points": 60, "sort_order": 6},
            {"name": "Avancerad JavaScript", "code": "JSADV101", "yh_points": 35, "sort_order": 7},
            {"name": "DevOps och CI/CD", "code": "DEVOPS101", "yh_points": 25, "sort_order": 8},
            {"name": "LIA 2", "code": "LIA2WEB", "yh_points": 80, "sort_order": 9},
            {"name": "Examensarbete", "code": "EXJOBWEB", "yh_points": 55, "sort_order": 10},
        ],
    },
    {
        "name": "Data Engineer",
        "code": "DATAENG26",
        "description": "Lar dig bygga och underhalla datapipelines, datalager och analysplattformar.",
        "yh_points": 400,
        "duration_weeks": 80,
        "status": "active",
        "leader_email": "erik.johansson@example.com",
        "courses": [
            {"name": "Python for databehandling", "code": "PYDATA101", "yh_points": 30, "sort_order": 1},
            {"name": "SQL och datamodellering", "code": "SQLMOD101", "yh_points": 30, "sort_order": 2},
            {"name": "ETL och datapipelines", "code": "ETL101", "yh_points": 35, "sort_order": 3},
            {"name": "Molntjanster (AWS/Azure)", "code": "CLOUD101", "yh_points": 30, "sort_order": 4},
            {"name": "LIA 1", "code": "LIA1DATA", "yh_points": 60, "sort_order": 5},
            {"name": "Big Data och Spark", "code": "SPARK101", "yh_points": 35, "sort_order": 6},
            {"name": "Machine Learning intro", "code": "ML101", "yh_points": 25, "sort_order": 7},
            {"name": "LIA 2", "code": "LIA2DATA", "yh_points": 80, "sort_order": 8},
            {"name": "Examensarbete", "code": "EXJOBDATA", "yh_points": 75, "sort_order": 9},
        ],
    },
    {
        "name": "UX Designer",
        "code": "UXDES26",
        "description": "Utbildningen fokuserar pa anvandarcentrerad design, prototyping och anvandbarhetstestning.",
        "yh_points": 300,
        "duration_weeks": 60,
        "status": "draft",
        "leader_email": None,
        "courses": [
            {"name": "Introduktion till UX", "code": "UX101", "yh_points": 20, "sort_order": 1},
            {"name": "Visuell design", "code": "VISDES101", "yh_points": 25, "sort_order": 2},
            {"name": "Prototyping med Figma", "code": "FIGMA101", "yh_points": 30, "sort_order": 3},
            {"name": "Anvandbarhetstestning", "code": "USTEST101", "yh_points": 25, "sort_order": 4},
            {"name": "LIA 1", "code": "LIA1UX", "yh_points": 50, "sort_order": 5},
            {"name": "Tjanstedesign", "code": "SRVDES101", "yh_points": 25, "sort_order": 6},
            {"name": "LIA 2", "code": "LIA2UX", "yh_points": 70, "sort_order": 7},
            {"name": "Examensarbete", "code": "EXJOBUX", "yh_points": 55, "sort_order": 8},
        ],
    },
]

# ---------------------------------------------------------------------------
# Cohorts -- one active cohort per active program, one planned
# ---------------------------------------------------------------------------

SAMPLE_COHORTS = [
    {
        "program_code": "WEBFUL26",
        "cohort_code": "WEBFUL25A",
        "start_date": date(2025, 8, 18),
        "end_date": date(2027, 4, 16),
        "status": "active",
        "study_pace": 100,
        "max_seats": 30,
    },
    {
        "program_code": "WEBFUL26",
        "cohort_code": "WEBFUL26A",
        "start_date": date(2026, 8, 17),
        "end_date": date(2028, 4, 14),
        "status": "planned",
        "study_pace": 100,
        "max_seats": 30,
    },
    {
        "program_code": "DATAENG26",
        "cohort_code": "DATAENG25A",
        "start_date": date(2025, 9, 1),
        "end_date": date(2027, 5, 28),
        "status": "active",
        "study_pace": 100,
        "max_seats": 25,
    },
    {
        "program_code": "DATAENG26",
        "cohort_code": "DATAENG25B",
        "start_date": date(2025, 9, 1),
        "end_date": date(2028, 5, 26),
        "status": "active",
        "study_pace": 50,
        "max_seats": 15,
    },
]

# ---------------------------------------------------------------------------
# Enrollment assignments: which students go to which cohorts
# ---------------------------------------------------------------------------

ENROLLMENT_MAP = {
    "WEBFUL25A": [
        "maria.svensson@example.com",
        "oscar.nilsson@example.com",
        "sara.andersson@example.com",
        "johan.eriksson@example.com",
        "emma.larsson@example.com",
        "anton.olsson@example.com",
        "linnea.persson@example.com",
        "viktor.karlsson@example.com",
        "ida.gustafsson@example.com",
        "felix.lundberg@example.com",
        "hanna.lindqvist@example.com",
        "alex.bergstrom@example.com",
        "elin.sandberg@example.com",
        "lucas.nordstrom@example.com",
        "amanda.wallin@example.com",
        "simon.hedlund@example.com",
        "julia.engstrom@example.com",
        "daniel.fransson@example.com",
        "maja.blom@example.com",
        "william.ek@example.com",
    ],
    "DATAENG25A": [
        "matilda.dahl@example.com",
        "adam.lund@example.com",
        "filippa.strand@example.com",
        "leo.bjork@example.com",
        "klara.aberg@example.com",
        "oliver.sjoberg@example.com",
        "wilma.nyberg@example.com",
        "elias.holmgren@example.com",
        "stella.ekstrom@example.com",
        "hugo.sundberg@example.com",
        "alva.magnusson@example.com",
        "isak.nordin@example.com",
        "saga.hoglund@example.com",
        "noel.vikstrom@example.com",
        "ebba.sjolund@example.com",
    ],
    "DATAENG25B": [
        "theo.hallberg@example.com",
        "selma.moberg@example.com",
        "liam.askman@example.com",
        "vera.grahn@example.com",
        "arvid.sjogren@example.com",
        "astrid.lilja@example.com",
        "melvin.skoglund@example.com",
        "mila.hellstrom@example.com",
        "alfred.rosen@example.com",
        "tuva.backman@example.com",
    ],
}

# ---------------------------------------------------------------------------
# Grades: first 3 courses of each active cohort get some grades
# ---------------------------------------------------------------------------

GRADE_DISTRIBUTION = ["G", "G", "G", "G", "VG", "VG", "G", "G", "IG", "G"]


# ===========================================================================
# Seeding functions
# ===========================================================================

def get_roles(session: Session) -> dict[str, Role]:
    roles = session.scalars(select(Role)).all()
    return {r.name: r for r in roles}


def seed_users(session: Session, roles: dict[str, Role]) -> dict[str, User]:
    users = {}
    for user_data in SAMPLE_USERS:
        existing = session.scalars(
            select(User).where(User.email == user_data["email"])
        ).first()
        if existing:
            print(f"  User '{user_data['email']}' already exists (id={existing.id})")
            users[existing.email] = existing
            continue

        role = roles[user_data["role_name"]]
        user = User(
            email=user_data["email"],
            first_name=user_data["first_name"],
            last_name=user_data["last_name"],
            hashed_password=hash_password(DEFAULT_PASSWORD),
            role_id=role.id,
        )
        session.add(user)
        session.flush()
        print(f"  Created user '{user.email}' as {user_data['role_name']} (id={user.id})")
        users[user.email] = user
    return users


def seed_programs(session: Session, users: dict[str, User]) -> dict[str, Program]:
    programs = {}
    for prog_data in SAMPLE_PROGRAMS:
        existing = session.scalars(
            select(Program).where(Program.code == prog_data["code"])
        ).first()
        if existing:
            print(f"  Program '{prog_data['code']}' already exists (id={existing.id})")
            programs[existing.code] = existing
            continue

        leader = users.get(prog_data["leader_email"]) if prog_data["leader_email"] else None

        program = Program(
            name=prog_data["name"],
            code=prog_data["code"],
            description=prog_data["description"],
            yh_points=prog_data["yh_points"],
            duration_weeks=prog_data["duration_weeks"],
            status=prog_data["status"],
            leader_id=leader.id if leader else None,
        )
        session.add(program)
        session.flush()
        print(f"  Created program '{program.code}' (id={program.id})")
        programs[program.code] = program

        for course_data in prog_data["courses"]:
            course_exists = session.scalars(
                select(Course).where(Course.code == course_data["code"])
            ).first()
            if course_exists:
                print(f"    Course '{course_data['code']}' already exists")
                continue

            course = Course(program_id=program.id, **course_data)
            session.add(course)
            print(f"    Added course '{course.code}' ({course.yh_points}p)")

        session.flush()

    # Also pick up existing programs not created this run
    all_programs = session.scalars(select(Program)).all()
    for p in all_programs:
        programs[p.code] = p

    return programs


def seed_cohorts(session: Session, programs: dict[str, Program]) -> dict[str, Cohort]:
    cohorts = {}
    for cohort_data in SAMPLE_COHORTS:
        existing = session.scalars(
            select(Cohort).where(Cohort.cohort_code == cohort_data["cohort_code"])
        ).first()
        if existing:
            print(f"  Cohort '{cohort_data['cohort_code']}' already exists (id={existing.id})")
            cohorts[existing.cohort_code] = existing
            continue

        program = programs.get(cohort_data["program_code"])
        if not program:
            print(f"  WARNING: Program '{cohort_data['program_code']}' not found, skipping cohort")
            continue

        cohort = Cohort(
            program_id=program.id,
            cohort_code=cohort_data["cohort_code"],
            start_date=cohort_data["start_date"],
            end_date=cohort_data["end_date"],
            status=cohort_data["status"],
            study_pace=cohort_data["study_pace"],
            max_seats=cohort_data["max_seats"],
        )
        session.add(cohort)
        session.flush()
        print(f"  Created cohort '{cohort.cohort_code}' for {cohort_data['program_code']} (id={cohort.id})")
        cohorts[cohort.cohort_code] = cohort

    return cohorts


def seed_enrollments(
    session: Session,
    cohorts: dict[str, Cohort],
    users: dict[str, User],
) -> None:
    count = 0
    for cohort_code, student_emails in ENROLLMENT_MAP.items():
        cohort = cohorts.get(cohort_code)
        if not cohort:
            print(f"  WARNING: Cohort '{cohort_code}' not found, skipping enrollments")
            continue

        for email in student_emails:
            student = users.get(email)
            if not student:
                print(f"  WARNING: Student '{email}' not found, skipping")
                continue

            existing = session.scalars(
                select(StudentEnrollment).where(
                    StudentEnrollment.student_id == student.id,
                    StudentEnrollment.cohort_id == cohort.id,
                )
            ).first()
            if existing:
                continue

            enrollment = StudentEnrollment(
                student_id=student.id,
                cohort_id=cohort.id,
                enrollment_date=cohort.start_date,
                status="active",
            )
            session.add(enrollment)
            count += 1

    session.flush()
    print(f"  Created {count} enrollments")


def seed_grades(
    session: Session,
    cohorts: dict[str, Cohort],
    users: dict[str, User],
) -> None:
    count = 0
    for cohort_code, student_emails in ENROLLMENT_MAP.items():
        cohort = cohorts.get(cohort_code)
        if not cohort:
            continue

        # Get program courses sorted by sort_order, take first 3
        courses = list(
            session.scalars(
                select(Course)
                .where(Course.program_id == cohort.program_id)
                .order_by(Course.sort_order)
            ).all()
        )
        gradeable_courses = courses[:3]

        if not gradeable_courses:
            continue

        # Find the program leader to use as grader
        program = session.scalars(
            select(Program).where(Program.id == cohort.program_id)
        ).first()
        grader_id = program.leader_id if program and program.leader_id else None
        if not grader_id:
            # Fall back to first utbildningsledare
            ul = session.scalars(
                select(User).join(Role).where(Role.name == "utbildningsledare")
            ).first()
            grader_id = ul.id if ul else None

        if not grader_id:
            print(f"  WARNING: No grader found, skipping grades for {cohort_code}")
            continue

        for i, email in enumerate(student_emails):
            student = users.get(email)
            if not student:
                continue

            for course in gradeable_courses:
                existing = session.scalars(
                    select(Grade).where(
                        Grade.student_id == student.id,
                        Grade.course_id == course.id,
                    )
                ).first()
                if existing:
                    continue

                grade_value = GRADE_DISTRIBUTION[i % len(GRADE_DISTRIBUTION)]
                grade = Grade(
                    student_id=student.id,
                    course_id=course.id,
                    grade=grade_value,
                    graded_by=grader_id,
                )
                session.add(grade)
                count += 1

    session.flush()
    print(f"  Created {count} grades")


def main():
    print("Seeding sample data...\n")

    with Session(engine) as session:
        roles = get_roles(session)
        if not roles:
            print("ERROR: No roles found. Run seed_db.py first!")
            return

        print("[Users]")
        users = seed_users(session, roles)

        print("\n[Programs & Courses]")
        programs = seed_programs(session, users)

        print("\n[Cohorts]")
        cohorts = seed_cohorts(session, programs)

        print("\n[Enrollments]")
        seed_enrollments(session, cohorts, users)

        print("\n[Grades]")
        seed_grades(session, cohorts, users)

        session.commit()
        print("\nDone! Sample data seeded successfully.")
        print(f"  Total users in SAMPLE_USERS: {len(SAMPLE_USERS)}")
        print(f"  Programs: {len(SAMPLE_PROGRAMS)}")
        print(f"  Cohorts: {len(SAMPLE_COHORTS)}")


if __name__ == "__main__":
    main()
