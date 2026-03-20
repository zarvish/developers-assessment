from datetime import date
from typing import Any, Optional

from fastapi import APIRouter

from app.api.deps import SessionDep
from app.api.routes.worklog import service
from app.api.routes.worklog.models import (
    FreelancerPublic,
    PaymentCreate,
    PaymentPublic,
    WorklogDetail,
    WorklogPublic,
)

router = APIRouter(tags=["worklog"])


@router.get("/worklogs/", response_model=list[WorklogPublic])
def read_worklogs(
    session: SessionDep,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> Any:
    return service.get_worklogs(session, start_date, end_date)


@router.get("/worklogs/freelancers", response_model=list[FreelancerPublic])
def read_freelancers(session: SessionDep) -> Any:
    return service.get_freelancers(session)


@router.get("/worklogs/{wl_id}", response_model=WorklogDetail)
def read_worklog(session: SessionDep, wl_id: int) -> Any:
    return service.get_worklog_detail(session, wl_id)


@router.post("/payments/", response_model=PaymentPublic, status_code=201)
def create_payment(session: SessionDep, payload: PaymentCreate) -> Any:
    return service.create_payment(session, payload)


@router.get("/payments/", response_model=list[PaymentPublic])
def read_payments(session: SessionDep) -> Any:
    return service.list_payments(session)
