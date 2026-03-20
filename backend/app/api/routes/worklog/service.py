import json
import logging
from datetime import date
from typing import Any, Optional

from fastapi import HTTPException
from sqlmodel import Session, select

from app.api.routes.worklog.models import (
    Freelancer,
    Payment,
    PaymentCreate,
    PaymentPublic,
    TimeEntryPublic,
    Worklog,
    WorklogDetail,
    WorklogPublic,
)


def get_worklogs(
    session: Session,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> list[WorklogPublic]:
    """
    Fetch all worklogs, optionally filtered by date range.
    Computes total_hours and total_earned in Python.
    """
    stmt = select(Worklog)
    if start_date:
        stmt = stmt.where(Worklog.created_at >= start_date)
    if end_date:
        from datetime import datetime, time
        dt_end = datetime.combine(end_date, time(23, 59, 59))
        stmt = stmt.where(Worklog.created_at <= dt_end)

    wls = session.exec(stmt).all()
    result = []

    for wl in wls:
        try:
            fl = session.get(Freelancer, wl.freelancer_id)
            from app.api.routes.worklog.models import TimeEntry
            entries = session.exec(
                select(TimeEntry).where(TimeEntry.worklog_id == wl.id)
            ).all()
            tot_hrs = sum(e.hours for e in entries)
            rate = fl.hourly_rate if fl else 0.0
            result.append(
                WorklogPublic(
                    id=wl.id,
                    task_name=wl.task_name,
                    freelancer_id=wl.freelancer_id,
                    freelancer_name=fl.name if fl else "",
                    freelancer_email=fl.email if fl else "",
                    hourly_rate=rate,
                    created_at=wl.created_at,
                    status=wl.status,
                    total_hours=tot_hrs,
                    total_earned=tot_hrs * rate,
                )
            )
        except Exception as e:
            logging.error(f"Failed to process worklog {wl.id}: {e}")
            continue

    return result


def get_worklog_detail(session: Session, wl_id: int) -> WorklogDetail:
    """
    Fetch a single worklog with all its time entries.
    """
    wl = session.get(Worklog, wl_id)
    if not wl:
        raise HTTPException(status_code=404, detail="Worklog not found")

    fl = session.get(Freelancer, wl.freelancer_id)
    from app.api.routes.worklog.models import TimeEntry
    entries = session.exec(
        select(TimeEntry).where(TimeEntry.worklog_id == wl_id)
    ).all()

    tot_hrs = sum(e.hours for e in entries)
    rate = fl.hourly_rate if fl else 0.0

    return WorklogDetail(
        id=wl.id,
        task_name=wl.task_name,
        freelancer_id=wl.freelancer_id,
        freelancer_name=fl.name if fl else "",
        freelancer_email=fl.email if fl else "",
        hourly_rate=rate,
        created_at=wl.created_at,
        status=wl.status,
        total_hours=tot_hrs,
        total_earned=tot_hrs * rate,
        entries=[
            TimeEntryPublic(
                id=e.id,
                worklog_id=e.worklog_id,
                description=e.description,
                hours=e.hours,
                entry_date=e.entry_date,
            )
            for e in entries
        ],
    )


def get_freelancers(session: Session) -> list[Any]:
    return session.exec(select(Freelancer)).all()


def create_payment(session: Session, payload: PaymentCreate) -> PaymentPublic:
    """
    Create a payment batch. Filters worklogs by date range, applies
    exclusions, marks included worklogs as 'paid', persists Payment record.
    """
    wls = get_worklogs(session, payload.start_date, payload.end_date)

    included = []
    for wl in wls:
        if wl.status == "paid":
            continue
        if wl.id in payload.excluded_worklog_ids:
            continue
        if wl.freelancer_id in payload.excluded_freelancer_ids:
            continue
        included.append(wl)

    if not included:
        raise HTTPException(status_code=400, detail="No eligible worklogs to pay")

    total = sum(w.total_earned for w in included)
    ids = [w.id for w in included]

    payment = Payment(
        total_amount=total,
        worklog_ids_json=json.dumps(ids),
    )
    session.add(payment)
    session.commit()

    # Mark worklogs as paid
    for wl_pub in included:
        wl_row = session.get(Worklog, wl_pub.id)
        if wl_row:
            wl_row.status = "paid"
            session.add(wl_row)
    session.commit()
    session.refresh(payment)

    return PaymentPublic(
        id=payment.id,
        created_at=payment.created_at,
        total_amount=payment.total_amount,
        worklog_ids=ids,
    )


def list_payments(session: Session) -> list[PaymentPublic]:
    payments = session.exec(select(Payment).order_by(Payment.created_at.desc())).all()
    result = []
    for p in payments:
        try:
            result.append(
                PaymentPublic(
                    id=p.id,
                    created_at=p.created_at,
                    total_amount=p.total_amount,
                    worklog_ids=p.get_worklog_ids(),
                )
            )
        except Exception as e:
            logging.error(f"Failed to process payment {p.id}: {e}")
            continue
    return result
