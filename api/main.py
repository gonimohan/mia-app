from fastapi import FastAPI, HTTPException, Request, File, UploadFile, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
import io
import uuid
import base64
from datetime import datetime
import traceback
from pydantic import BaseModel
from typing import Dict, Any, List, Optional, Union
import asyncio
import aiohttp
import logging
import pandas as pd
import numpy as np
from supabase import create_client, Client
from pathlib import Path
import json

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

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Optional[Client] = None

if supabase_url and supabase_service_key:
    try:
        supabase = create_client(supabase_url, supabase_service_key)
        logger.info("Supabase client initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
else:
    logger.warning("Supabase credentials not found in environment variables")

# Create uploads directory
UPLOAD_DIR = Path("/app/uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

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

class DataSource(BaseModel):
    name: str
    type: str
    description: Optional[str] = None
    category: Optional[str] = None
    config: Dict[str, Any] = {}
    status: str = "inactive"

class FileAnalysisRequest(BaseModel):
    file_id: str
    analysis_type: str = "comprehensive"
    additional_context: Optional[str] = None

# Authentication dependency
def get_current_user(request: Request):
    # Extract JWT token from Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = auth_header.split(" ")[1]
    
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
    
    try:
        # Verify JWT token with Supabase
        user = supabase.auth.get_user(token)
        return user.user
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        raise HTTPException(status_code=401, detail="Invalid authentication token")

# File processing utilities
class FileProcessor:
    @staticmethod
    def process_csv(file_content: bytes) -> Dict[str, Any]:
        """Process CSV file and return structured data"""
        try:
            df = pd.read_csv(io.BytesIO(file_content))
            return {
                "type": "csv",
                "rows": len(df),
                "columns": len(df.columns),
                "column_names": df.columns.tolist(),
                "data_types": df.dtypes.astype(str).to_dict(),
                "summary": df.describe().to_dict(),
                "sample_data": df.head(10).to_dict(orient="records"),
                "null_counts": df.isnull().sum().to_dict()
            }
        except Exception as e:
            logger.error(f"CSV processing error: {e}")
            raise HTTPException(status_code=400, detail=f"CSV processing failed: {str(e)}")

    @staticmethod
    def process_excel(file_content: bytes) -> Dict[str, Any]:
        """Process Excel file and return structured data"""
        try:
            # Read all sheets
            xl_file = pd.ExcelFile(io.BytesIO(file_content))
            sheets_data = {}
            
            for sheet_name in xl_file.sheet_names:
                df = pd.read_excel(io.BytesIO(file_content), sheet_name=sheet_name)
                sheets_data[sheet_name] = {
                    "rows": len(df),
                    "columns": len(df.columns),
                    "column_names": df.columns.tolist(),
                    "data_types": df.dtypes.astype(str).to_dict(),
                    "summary": df.describe().to_dict(),
                    "sample_data": df.head(5).to_dict(orient="records"),
                    "null_counts": df.isnull().sum().to_dict()
                }
            
            return {
                "type": "excel",
                "sheets": list(xl_file.sheet_names),
                "sheets_data": sheets_data
            }
        except Exception as e:
            logger.error(f"Excel processing error: {e}")
            raise HTTPException(status_code=400, detail=f"Excel processing failed: {str(e)}")

    @staticmethod
    def process_text(file_content: bytes) -> Dict[str, Any]:
        """Process text file and return analysis"""
        try:
            text = file_content.decode('utf-8', errors='ignore')
            lines = text.split('\n')
            words = text.split()
            
            return {
                "type": "text",
                "character_count": len(text),
                "word_count": len(words),
                "line_count": len(lines),
                "sample_content": text[:500] + "..." if len(text) > 500 else text,
                "encoding": "utf-8"
            }
        except Exception as e:
            logger.error(f"Text processing error: {e}")
            raise HTTPException(status_code=400, detail=f"Text processing failed: {str(e)}")

    @staticmethod
    def process_pdf(file_content: bytes) -> Dict[str, Any]:
        """Process PDF file (basic info for now)"""
        try:
            # For now, return basic file info
            # In production, you'd use PyPDF2 or similar
            return {
                "type": "pdf",
                "size_bytes": len(file_content),
                "note": "PDF text extraction requires additional libraries. File stored for future processing.",
                "processing_status": "pending"
            }
        except Exception as e:
            logger.error(f"PDF processing error: {e}")
            raise HTTPException(status_code=400, detail=f"PDF processing failed: {str(e)}")

# Market Intelligence AI Agent
class MarketIntelligenceAgent:
    def __init__(self):
        self.google_api_key = os.getenv("GOOGLE_API_KEY")
        self.news_api_key = os.getenv("NEWS_API_KEY")
        self.tavily_api_key = os.getenv("TAVILY_API_KEY")
        
    async def generate_insights(self, query: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate AI-powered market intelligence insights"""
        try:
            # Simulated AI analysis for now
            # In production, integrate with actual LLM APIs
            insights = {
                "query": query,
                "insights": [
                    f"Market analysis for '{query}' shows emerging trends in digital transformation",
                    f"Competitive landscape analysis reveals 3 key players in the {context.get('market_domain', 'general')} space",
                    f"Growth opportunities identified in {context.get('market_domain', 'target market')} segment",
                    f"Risk factors include market volatility and regulatory changes"
                ],
                "recommendations": [
                    "Focus on digital-first approach to capture emerging market segments",
                    "Invest in customer experience improvements",
                    "Monitor competitive pricing strategies closely",
                    "Diversify market presence to reduce concentration risk"
                ],
                "confidence_score": 0.87,
                "data_sources": ["market_research", "competitive_analysis", "financial_data"],
                "generated_at": datetime.now().isoformat()
            }
            
            return insights
        except Exception as e:
            logger.error(f"AI insights generation error: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to generate insights: {str(e)}")

    async def process_file_with_ai(self, file_data: Dict[str, Any], query: str = None) -> Dict[str, Any]:
        """Process uploaded file data with AI analysis"""
        try:
            analysis = {
                "file_type": file_data.get("type"),
                "processing_timestamp": datetime.now().isoformat(),
                "ai_insights": [],
                "recommendations": [],
                "visualizations": []
            }
            
            if file_data.get("type") == "csv":
                # Analyze CSV data
                analysis["ai_insights"] = [
                    f"Dataset contains {file_data.get('rows', 0)} records across {file_data.get('columns', 0)} dimensions",
                    "Data quality assessment: " + ("High" if file_data.get('null_counts', {}) else "Moderate"),
                    "Potential for trend analysis and predictive modeling identified"
                ]
                
                analysis["recommendations"] = [
                    "Consider time-series analysis if temporal data is present",
                    "Implement data validation for missing values",
                    "Explore correlation patterns between key variables"
                ]
            
            elif file_data.get("type") == "text":
                # Analyze text content
                word_count = file_data.get("word_count", 0)
                analysis["ai_insights"] = [
                    f"Document contains {word_count} words across {file_data.get('line_count', 0)} lines",
                    "Text complexity: " + ("High" if word_count > 1000 else "Moderate"),
                    "Suitable for sentiment analysis and content categorization"
                ]
                
                analysis["recommendations"] = [
                    "Perform sentiment analysis to gauge market perception",
                    "Extract key entities and topics for market intelligence",
                    "Consider competitive mention analysis"
                ]
                
            return analysis
            
        except Exception as e:
            logger.error(f"File AI processing error: {e}")
            raise HTTPException(status_code=500, detail=f"AI file processing failed: {str(e)}")

# Initialize AI agent
ai_agent = MarketIntelligenceAgent()

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
        "timestamp": datetime.now().isoformat(),
        "features": [
            "market_analysis",
            "file_processing", 
            "rag_chat",
            "data_integration",
            "ai_insights"
        ]
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "api": "running",
            "database": "connected" if supabase else "not_configured",
            "ai_agent": "ready",
            "file_processor": "ready"
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
