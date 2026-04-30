from sqlalchemy.orm import Session

from app.db.models import UserProfile, WorkExperience, Project, Skill, Education


def get_profile(db: Session) -> UserProfile | None:
    return db.query(UserProfile).first()


def get_experiences(db: Session) -> list[WorkExperience]:
    return db.query(WorkExperience).order_by(WorkExperience.start_date.desc()).all()


def get_projects(db: Session) -> list[Project]:
    return db.query(Project).all()


def get_project(db: Session, project_id: int) -> Project | None:
    return db.query(Project).filter(Project.id == project_id).first()


def get_skills(db: Session) -> list[Skill]:
    return db.query(Skill).all()


def get_education(db: Session) -> list[Education]:
    return db.query(Education).order_by(Education.start_date.desc()).all()
