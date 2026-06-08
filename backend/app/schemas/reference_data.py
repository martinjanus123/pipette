from pydantic import BaseModel


class ReferenceItem(BaseModel):
    id: int
    name: str
    is_active: bool

    model_config = {"from_attributes": True}
+
+
+class ApplicationCreate(BaseModel):
+    name: str
+
+    model_config = {"extra": "forbid"}
