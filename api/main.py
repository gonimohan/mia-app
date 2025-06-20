from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
from datetime import datetime
import traceback
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import asyncio
import aiohttp
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Market Intelligence Agent API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class AnalysisRequest(BaseModel):
    query: str
    market_domain: str
    question: Optional[str] = None

class ChatRequest(BaseModel):
    messages: List[Dict[str, Any]]
    context: Optional[Dict[str, Any]] = None

class AgentSyncRequest(BaseModel):
    action: str
    data: Optional[Dict[str, Any]] = None

class KPIRequest(BaseModel):
    metric: str
    value: float
    timestamp: Optional[str] = None

# Global error handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {str(exc)}\n{traceback.format_exc()}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "details": str(exc),
            "timestamp": datetime.now().isoformat()
        }
    )

@app.get("/")
async def root():
    return {
        "message": "Market Intelligence Agent API",
        "version": "1.0.0",
        "status": "running",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "api": "running",
            "database": "connected" if os.getenv("DATABASE_URL") else "not_configured"
        }
    }

@app.post("/analyze")
async def analyze(request: AnalysisRequest):
    try:
        logger.info(f"Analysis request: {request.query} for domain: {request.market_domain}")

        # Mock analysis for now - replace with actual AI logic
        analysis_result = {
            "query": request.query,
            "market_domain": request.market_domain,
            "question": request.question,
            "analysis": f"Market analysis for '{request.query}' in {request.market_domain} domain. This is a comprehensive analysis covering market trends, competitive landscape, and opportunities.",
            "insights": [
                f"Key insight 1 for {request.market_domain}",
                f"Market trend analysis for {request.query}",
                "Competitive positioning recommendations",
                "Growth opportunities identified"
            ],
            "confidence_score": 0.87,
            "timestamp": datetime.now().isoformat(),
            "metadata": {
                "processing_time_ms": 1250,
                "data_sources": ["news_api", "market_data", "social_sentiment"],
                "version": "1.0.0"
            }
        }

        return analysis_result
    except Exception as e:
        logger.error(f"Analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        logger.info(f"Chat request with {len(request.messages)} messages")

        last_message = request.messages[-1] if request.messages else {}
        user_content = last_message.get("content", "")

        # Mock chat response - replace with actual AI logic
        response = {
            "response": f"Thank you for your question about '{user_content}'. Based on my market intelligence analysis, I can provide you with comprehensive insights. This would normally include real-time market data, competitive analysis, and strategic recommendations.",
            "context": {
                "message_count": len(request.messages),
                "query_type": "market_intelligence",
                "confidence": 0.92,
                "timestamp": datetime.now().isoformat()
            },
            "suggestions": [
                "Would you like more details about market trends?",
                "Should I analyze competitor positioning?",
                "Do you need strategic recommendations?"
            ]
        }

        return response
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")

@app.get("/kpi")
async def get_kpi(timeframe: str = "30d", category: str = "all"):
    try:
        logger.info(f"KPI request: timeframe={timeframe}, category={category}")

        # Mock KPI data - replace with actual database queries
        kpi_data = {
            "revenue": {
                "current": 125000 + (hash(timeframe) % 10000),
                "previous": 118000,
                "change": 5.9,
                "trend": "up"
            },
            "customers": {
                "current": 1250 + (hash(category) % 100),
                "previous": 1180,
                "change": 5.9,
                "trend": "up"
            },
            "conversion": {
                "current": 3.2,
                "previous": 2.8,
                "change": 14.3,
                "trend": "up"
            },
            "satisfaction": {
                "current": 4.6,
                "previous": 4.4,
                "change": 4.5,
                "trend": "up"
            },
            "metadata": {
                "timeframe": timeframe,
                "category": category,
                "last_updated": datetime.now().isoformat(),
                "data_quality": "high"
            }
        }

        return kpi_data
    except Exception as e:
        logger.error(f"KPI error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"KPI fetch failed: {str(e)}")

@app.post("/kpi")
async def store_kpi(request: KPIRequest):
    try:
        logger.info(f"Storing KPI: {request.metric} = {request.value}")

        # Mock storage - replace with actual database storage
        stored_data = {
            "success": True,
            "metric": request.metric,
            "value": request.value,
            "timestamp": request.timestamp or datetime.now().isoformat(),
            "id": f"kpi_{hash(request.metric)}_{int(datetime.now().timestamp())}"
        }

        return stored_data
    except Exception as e:
        logger.error(f"KPI storage error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"KPI storage failed: {str(e)}")

@app.post("/agent/sync")
async def agent_sync(request: AgentSyncRequest):
    try:
        logger.info(f"Agent sync: action={request.action}")

        # Mock sync response - replace with actual agent logic
        sync_result = {
            "success": True,
            "action": request.action,
            "data": request.data,
            "status": "completed",
            "timestamp": datetime.now().isoformat(),
            "sync_id": f"sync_{hash(request.action)}_{int(datetime.now().timestamp())}"
        }

        return sync_result
    except Exception as e:
        logger.error(f"Agent sync error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Agent sync failed: {str(e)}")

@app.get("/agent/status")
async def agent_status():
    return {
        "status": "online",
        "version": "1.0.0",
        "uptime": "running",
        "capabilities": [
            "market_analysis",
            "chat_interface",
            "kpi_tracking",
            "data_sync"
        ],
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = "0.0.0.0"

    logger.info(f"Starting Market Intelligence Agent API on {host}:{port}")
    uvicorn.run(app, host=host, port=port, log_level="info")
