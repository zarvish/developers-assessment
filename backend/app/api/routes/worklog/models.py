import json
from datetime import date, datetime
from typing import Optional

from pydantic import field_validator
from sqlmodel import Field, SQLModel


class Freelancer(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    email: str = Field(index=True, unique=True)
    hourly_rate: float = Field(default=0.0)


class Worklog(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    task_name: str
    freelancer_id: int = Field(foreign_key="freelancer.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    status: str = Field(default="pending", index=True)


class TimeEntry(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    worklog_id: int = Field(foreign_key="worklog.id", index=True)
    description: str
    hours: float
    entry_date: date = Field(index=True)


class Payment(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    total_amount: float
    worklog_ids_json: str = Field(default="[]")

    def get_worklog_ids(self) -> list[int]:
        try:
            return json.loads(self.worklog_ids_json)
        except Exception:
            return []


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class FreelancerPublic(SQLModel):
    id: int
    name: str
    email: str
    hourly_rate: float


class TimeEntryPublic(SQLModel):
    id: int
    worklog_id: int
    description: str
    hours: float
    entry_date: date


class WorklogPublic(SQLModel):
    id: int
    task_name: str
    freelancer_id: int
    freelancer_name: str
    freelancer_email: str
    hourly_rate: float
    created_at: datetime
    status: str
    total_hours: float
    total_earned: float


class WorklogDetail(SQLModel):
    id: int
    task_name: str
    freelancer_id: int
    freelancer_name: str
    freelancer_email: str
    hourly_rate: float
    created_at: datetime
    status: str
    total_hours: float
    total_earned: float
    entries: list[TimeEntryPublic]


class PaymentCreate(SQLModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    excluded_worklog_ids: list[int] = Field(default=[])
    excluded_freelancer_ids: list[int] = Field(default=[])

    @field_validator("excluded_worklog_ids")
    @classmethod
    def validate_wl_ids(cls, v: list[int]) -> list[int]:
        if v is None:
            return []
        return v

    @field_validator("excluded_freelancer_ids")
    @classmethod
    def validate_fl_ids(cls, v: list[int]) -> list[int]:
        if v is None:
            return []
        return v


class PaymentPublic(SQLModel):
    id: int
    created_at: datetime
    total_amount: float
    worklog_ids: list[int]
