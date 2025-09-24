from fastapi import FastAPI

app = FastAPI(title="Authentication Demo", version="1.0.0")


@app.get("/")
async def root():
    return {"message": "Welcome to FastAPI Authentication Demo"}
