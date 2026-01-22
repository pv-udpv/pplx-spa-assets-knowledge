"""HAR entry model"""
from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel, Column, JSON


class HAREntry(SQLModel, table=True):
    """HAR entry with full request/response metadata"""
    
    __tablename__ = "har_entries"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    started_datetime: datetime
    time: float = Field(description="Duration in milliseconds")
    method: str = Field(max_length=10, index=True)
    url: str = Field(max_length=2000)
    status: int = Field(index=True)
    mime_type: str = Field(default="", max_length=100)
    size_bytes: int = Field(default=0, ge=0)
    
    # JSON columns (DuckDB native support)
    request_headers: dict = Field(default_factory=dict, sa_column=Column(JSON))
    response_headers: dict = Field(default_factory=dict, sa_column=Column(JSON))
    
    # Metadata
    category: str = Field(max_length=50, index=True)
    is_api: bool = Field(default=False, index=True)
    is_js_asset: bool = Field(default=False, index=True)
    
    class Config:
        arbitrary_types_allowed = True
