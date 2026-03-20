from datetime import date, datetime, timedelta

from sqlmodel import Session, create_engine, select

from app import crud
from app.core.config import settings
from app.models import User, UserCreate

engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))


# make sure all SQLModel models are imported (app.models) before initializing DB
# otherwise, SQLModel might fail to initialize relationships properly
# for more details: https://github.com/fastapi/full-stack-fastapi-template/issues/28
# Also import worklog models so they are registered in SQLModel metadata
from app.api.routes.worklog.models import (  # noqa: E402
    Freelancer,
    TimeEntry,
    Worklog,
)


def _seed_worklog_data(session: Session) -> None:
    existing = session.exec(select(Freelancer)).first()
    if existing:
        return

    freelancers = [
        Freelancer(name="Alice Chen", email="alice@freelancers.dev", hourly_rate=85.0),
        Freelancer(name="Bob Martinez", email="bob@freelancers.dev", hourly_rate=70.0),
        Freelancer(name="Carol Smith", email="carol@freelancers.dev", hourly_rate=95.0),
    ]
    for fl in freelancers:
        session.add(fl)
    session.commit()
    for fl in freelancers:
        session.refresh(fl)

    today = datetime.utcnow()

    worklogs_data = [
        # Alice – 2 tasks
        {"task": "API Integration", "fl": freelancers[0], "days_ago": 5},
        {"task": "Database Schema Design", "fl": freelancers[0], "days_ago": 12},
        # Bob – 2 tasks
        {"task": "Frontend Dashboard", "fl": freelancers[1], "days_ago": 3},
        {"task": "Unit Test Coverage", "fl": freelancers[1], "days_ago": 20},
        # Carol – 2 tasks
        {"task": "DevOps Pipeline Setup", "fl": freelancers[2], "days_ago": 7},
        {"task": "Code Review & Architecture", "fl": freelancers[2], "days_ago": 15},
    ]

    entries_data = {
        "API Integration": [
            ("Design endpoint contracts", 2.5, 6),
            ("Implement OAuth flow", 3.0, 5),
            ("Write integration tests", 4.0, 4),
            ("Fix edge cases in token refresh", 1.5, 5),
        ],
        "Database Schema Design": [
            ("Draft ER diagram", 2.0, 14),
            ("Review with team", 1.0, 13),
            ("Write migration scripts", 3.5, 12),
            ("Optimize indexes", 2.0, 11),
        ],
        "Frontend Dashboard": [
            ("Set up Vite project", 1.0, 4),
            ("Build chart components", 4.5, 3),
            ("Integrate API calls", 3.0, 3),
            ("Responsive layout fixes", 2.0, 3),
        ],
        "Unit Test Coverage": [
            ("Audit existing tests", 2.0, 22),
            ("Write auth module tests", 3.5, 21),
            ("Write service layer tests", 4.0, 20),
            ("CI pipeline integration", 1.5, 20),
        ],
        "DevOps Pipeline Setup": [
            ("Configure Docker build", 3.0, 8),
            ("Set up GitHub Actions", 2.5, 7),
            ("Deploy to staging", 1.5, 7),
            ("Monitor and fix flaky tests", 2.0, 7),
        ],
        "Code Review & Architecture": [
            ("Initial architecture review", 3.0, 17),
            ("Document design decisions", 2.0, 16),
            ("Follow-up review session", 2.5, 15),
            ("Create ADR documents", 1.5, 15),
        ],
    }

    for wd in worklogs_data:
        wl = Worklog(
            task_name=wd["task"],
            freelancer_id=wd["fl"].id,
            created_at=today - timedelta(days=wd["days_ago"]),
            status="pending",
        )
        session.add(wl)
        session.commit()
        session.refresh(wl)

        for desc, hrs, days_ago in entries_data[wd["task"]]:
            entry = TimeEntry(
                worklog_id=wl.id,
                description=desc,
                hours=hrs,
                entry_date=(today - timedelta(days=days_ago)).date(),
            )
            session.add(entry)
        session.commit()


def init_db(session: Session) -> None:
    # Tables should be created with Alembic migrations
    # But if you don't want to use migrations, create
    # the tables un-commenting the next lines
    # from sqlmodel import SQLModel

    # This works because the models are already imported and registered from app.models
    # SQLModel.metadata.create_all(engine)

    user = session.exec(
        select(User).where(User.email == settings.FIRST_SUPERUSER)
    ).first()
    if not user:
        user_in = UserCreate(
            email=settings.FIRST_SUPERUSER,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            is_superuser=True,
        )
        user = crud.create_user(session=session, user_create=user_in)

    _seed_worklog_data(session)

