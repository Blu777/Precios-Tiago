import os
from sqlalchemy import create_engine

turso_url = os.environ.get("TURSO_URL", "libsql://preciostiago-tiagonatale.aws-us-east-2.turso.io")
turso_token = os.environ.get("TURSO_AUTH_TOKEN", "YOUR_TOKEN_HERE")

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
