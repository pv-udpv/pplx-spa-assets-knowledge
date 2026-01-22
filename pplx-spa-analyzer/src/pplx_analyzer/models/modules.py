"""JavaScript module model"""
from typing import Optional
from sqlmodel import Field, SQLModel


class JSModule(SQLModel, table=True):
    """JavaScript bundle/module metadata"""
    
    __tablename__ = "js_modules"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    filename: str = Field(max_length=255, index=True)
    url: str = Field(max_length=2000)
    size_kb: float = Field(ge=0)
    category: str = Field(max_length=50, index=True)
    module_type: str = Field(max_length=20)  # app/vendor
    har_entry_id: Optional[int] = Field(default=None, foreign_key="har_entries.id")
