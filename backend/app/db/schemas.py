from pydantic import BaseModel


class UserProfileSchema(BaseModel):
    id: int
    name: str
    title: str
    years_of_experience: int
    email: str
    phone: str
    location: str
    bio: str
    github: str
    blog: str

    model_config = {"from_attributes": True}


class WorkExperienceSchema(BaseModel):
    id: int
    company: str
    position: str
    start_date: str
    end_date: str
    description: str

    model_config = {"from_attributes": True}


class ProjectSchema(BaseModel):
    id: int
    name: str
    tech_stack: str
    description: str
    role: str
    highlights: str

    model_config = {"from_attributes": True}


class SkillSchema(BaseModel):
    id: int
    category: str
    name: str
    proficiency: str

    model_config = {"from_attributes": True}


class EducationSchema(BaseModel):
    id: int
    school: str
    degree: str
    major: str
    start_date: str
    end_date: str
    highlights: str

    model_config = {"from_attributes": True}


class ChatRequest(BaseModel):
    session_id: str
    message: str


class ChatResponseChunk(BaseModel):
    event: str
    data: str


class HealthResponse(BaseModel):
    status: str
    version: str = "1.0.0"
    database: str = "ok"
    vector_store: str = "ok"
