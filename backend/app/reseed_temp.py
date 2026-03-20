from sqlmodel import Session, select
from app.core.db import engine, _seed_worklog_data
from app.api.routes.worklog.models import Freelancer, Worklog, TimeEntry, Payment

def reseed():
    with Session(engine) as session:
        # Clear existing data
        print("Clearing existing worklog data...")
        entries = session.exec(select(TimeEntry)).all()
        for e in entries:
            session.delete(e)
            
        worklogs = session.exec(select(Worklog)).all()
        for w in worklogs:
            session.delete(w)
            
        payments = session.exec(select(Payment)).all()
        for p in payments:
            session.delete(p)
            
        freelancers = session.exec(select(Freelancer)).all()
        for f in freelancers:
            session.delete(f)
            
        session.commit()
        
        # Reseed
        print("Seeding new data...")
        _seed_worklog_data(session)
        print("Done!")

if __name__ == "__main__":
    reseed()
