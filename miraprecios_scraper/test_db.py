import os
from sqlalchemy import create_engine

turso_url = "libsql://preciostiago-tiagonatale.aws-us-east-2.turso.io"
turso_token = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODAzNTMwMzYsImlkIjoiMDE5ZTgzNTQtMjIwMS03YmE1LTgzMWQtMTBhMmU1NGE1NmJjIiwicmlkIjoiYWJmMTNhNmMtNGYxNS00NjFkLThhNWMtNDg3MzdkNjNlYWIyIn0.slo9vq6pUh9yI8wGoUfY0cQP64eow7Jx-Jje0OXRhbF1HQdaZ1jPUYhc9ZOC33JPQB1C-eKjLEnfFNky0cWXCQ"

if turso_url.startswith("libsql://"):
    db_url = turso_url.replace("libsql://", "sqlite+libsql://", 1)
else:
    db_url = f"sqlite+libsql://{turso_url.replace('https://', '')}"

url = f"{db_url}?authToken={turso_token}&secure=true"
print("Connecting to:", url)
engine = create_engine(url)
with engine.connect() as conn:
    print("Connected!")
    res = conn.execute("SELECT 1")
    print("Result:", res.fetchone())
