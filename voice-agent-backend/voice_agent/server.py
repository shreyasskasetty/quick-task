import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from langserve import add_routes
from dotenv import load_dotenv
from voice_agent.graph import create_graph
from type import ChatInputType
load_dotenv(dotenv_path="/Users/shreyasskasetty/Documents/Texas A&M University Documents/Spring 2025/Directed Studies/QuickTask/quick-task-agent/backend/.env")

def start() -> None:
    app = FastAPI(
        title="Gen UI Backend",
        version="1.0",
        description="A simple api server using Langchain's Runnable interfaces",
    )

    # Configure CORS
    origins = [
        "http://localhost",
        "http://localhost:3000",
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    graph = create_graph()

    runnable = graph.with_types(input_type=ChatInputType, output_type=dict)

    add_routes(app, runnable, path="/chat", playground_type="chat")
    print("Starting server...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
