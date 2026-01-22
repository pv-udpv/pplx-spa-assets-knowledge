"""API endpoint and call models"""
from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel, Column, JSON


class APIEndpoint(SQLModel, table=True):
    """API endpoint catalog with observed metadata"""
    
    __tablename__ = "api_endpoints"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    method: str = Field(max_length=10, index=True)
    path: str = Field(max_length=500, index=True)
    category: str = Field(max_length=50, index=True)
    operation_id: str = Field(max_length=100, unique=True)
    summary: Optional[str] = None
    
    # Observed data (for schema generation)
    observed_query_params: dict = Field(default_factory=dict, sa_column=Column(JSON))
    observed_request_body: dict = Field(default_factory=dict, sa_column=Column(JSON))
    observed_response_body: dict = Field(default_factory=dict, sa_column=Column(JSON))
    observed_status_codes: list = Field(default_factory=list, sa_column=Column(JSON))
    
    # Stats
    call_count: int = Field(default=0, ge=0)
    first_seen: Optional[datetime] = None
    last_seen: Optional[datetime] = None


class APICall(SQLModel, table=True):
    """Individual API call observation"""
    
    __tablename__ = "api_calls"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    endpoint_id: int = Field(foreign_key="api_endpoints.id", index=True)
    timestamp: datetime
    status: int
    duration_ms: float
    request_params: dict = Field(default_factory=dict, sa_column=Column(JSON))
    request_body: dict = Field(default_factory=dict, sa_column=Column(JSON))
    response_body: dict = Field(default_factory=dict, sa_column=Column(JSON))
    har_entry_id: int = Field(foreign_key="har_entries.id")
