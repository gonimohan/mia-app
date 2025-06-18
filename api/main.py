from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import asyncio
import logging
from datetime import datetime
import os

# Import our agent logic
from agent_logic import MarketIntelligenceAgent

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Market Intelligence Agent API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the agent
agent = MarketIntelligenceAgent()

# Request/Response models
class AnalysisRequest(BaseModel):
    query: str
    sources: Optional[List[str]] = None
    filters: Optional[Dict[str, Any]] = None

class AnalysisResponse(BaseModel):
    success: bool
    data: Dict[str, Any]
    message: str
    timestamp: str

class SyncRequest(BaseModel):
    force_refresh: Optional[bool] = False

@app.get("/")
async def root():
    return {
        "message": "Market Intelligence Agent API",
        "version": "1.0.0",
        "status": "active",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "api": "running",
            "agent": "active",
            "data_sources": "connected"
        }
    }

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_market(request: AnalysisRequest):
    try:
        logger.info(f"Received analysis request: {request.query}")
        
        # Run the analysis
        result = await agent.analyze(
            query=request.query,
            sources=request.sources,
            filters=request.filters
        )
        
        return AnalysisResponse(
            success=True,
            data=result,
            message="Analysis completed successfully",
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/sync")
async def sync_data(request: SyncRequest):
    try:
        logger.info("Starting data sync...")
        
        result = await agent.sync_data(force_refresh=request.force_refresh)
        
        return {
            "success": True,
            "data": result,
            "message": "Data sync completed",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Sync error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/kpis")
async def get_kpis():
    try:
        kpis = await agent.get_kpis()
        return {
            "success": True,
            "data": kpis,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"KPI error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/competitors")
async def get_competitors():
    try:
        competitors = await agent.get_competitors()
        return {
            "success": True,
            "data": competitors,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Competitors error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/trends")
async def get_trends():
    try:
        trends = await agent.get_trends()
        return {
            "success": True,
            "data": trends,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Trends error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/customer-insights")
async def get_customer_insights():
    try:
        insights = await agent.get_customer_insights()
        return {
            "success": True,
            "data": insights,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Customer insights error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
