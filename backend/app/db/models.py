from sqlalchemy import Column, Integer, String, Text
from app.db.database import Base


class UserProfile(Base):
    __tablename__ = "user_profile"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False)
    title = Column(String(100), nullable=False)
    years_of_experience = Column(Integer, default=0)
    email = Column(String(100), default="")
    phone = Column(String(30), default="")
    location = Column(String(100), default="")
    bio = Column(Text, default="")
    github = Column(String(200), default="")
    blog = Column(String(200), default="")


class WorkExperience(Base):
    __tablename__ = "work_experiences"

    id = Column(Integer, primary_key=True, autoincrement=True)
    company = Column(String(100), nullable=False)
    position = Column(String(100), nullable=False)
    start_date = Column(String(20), nullable=False)
    end_date = Column(String(20), default="至今")
    description = Column(Text, default="")


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(150), nullable=False)
    tech_stack = Column(String(300), default="")
    description = Column(Text, default="")
    role = Column(String(100), default="")
    highlights = Column(Text, default="")


class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, autoincrement=True)
    category = Column(String(50), nullable=False)
    name = Column(String(100), nullable=False)
    proficiency = Column(String(20), default="熟练")


class Education(Base):
    __tablename__ = "education"

    id = Column(Integer, primary_key=True, autoincrement=True)
    school = Column(String(100), nullable=False)
    degree = Column(String(50), nullable=False)
    major = Column(String(100), nullable=False)
    start_date = Column(String(20), nullable=False)
    end_date = Column(String(20), nullable=False)
    highlights = Column(Text, default="")
