from fastapi import FastAPI, HTTPException, Query, Depends, Header, status
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Annotated
import asyncio
import logging
from datetime import datetime, timezone
import os
import uuid # For generating IDs if needed, and for type hints

# Import our agent logic
from agent_logic import MarketIntelligenceAgent, get_supabase_client # Assuming get_supabase_client is robust for auth and db ops

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
    market_domain: str
    question: Optional[str] = None

class AnalysisResponse(BaseModel):
    success: bool
    data: Dict[str, Any]
    message: str
    timestamp: str

class SyncRequest(BaseModel):
    force_refresh: Optional[bool] = False

class ChatRequest(BaseModel):
    message: str
    session_id: str
    history: Optional[List[Dict[str, Any]]] = None

class ChatResponse(BaseModel):
    success: bool
    response: str
    session_id: str
    timestamp: str

# --- Authentication Dependency ---
class SupabaseUser(BaseModel):
    id: str
    email: Optional[str] = None
    # Add other fields from Supabase user object if needed by your app logic

async def get_current_user(authorization: Annotated[str | None, Header()] = None) -> SupabaseUser:
    if authorization is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated: No Authorization header")

    token_type, _, token = authorization.partition(' ')
    if token_type.lower() != "bearer" or not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type or token missing")

    supabase = get_supabase_client()
    if not supabase:
        # This case should ideally not happen if agent_logic.get_supabase_client is robust
        # and critical for the app. Consider how agent_logic handles this.
        logger.error("Supabase client not available during get_current_user call.")
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Authentication service not available")

    try:
        # supabase-py's auth.get_user is synchronous
        response = await run_in_threadpool(supabase.auth.get_user, token=token)
        user = response.user
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
        # Ensure user.id is str, Supabase might return UUID object
        return SupabaseUser(id=str(user.id), email=user.email)
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        # Check if the error message indicates an invalid token specifically
        if "Invalid JWT" in str(e) or "invalid token" in str(e).lower():
             raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Authentication failed: {str(e)}")


# --- Data Source Pydantic Models ---
class DataSourceBase(BaseModel):
    name: str
    type: str # e.g., "api", "rss", "website_scrape", "file_upload"
    config: Dict[str, Any] # Store API keys, URLs, paths, etc.
    description: Optional[str] = None
    category: Optional[str] = None # e.g., "Financial", "News", "Competitor"

class DataSourceCreate(DataSourceBase):
    pass

class DataSourceUpdate(BaseModel): # All fields optional for PUT
    name: Optional[str] = None
    type: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    description: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None # e.g., "active", "inactive", "error"

class DataSourceResponse(DataSourceBase):
    id: str # UUID as string
    user_id: str # UUID as string
    status: str
    last_sync: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True # for compatibility with ORM objects, though Supabase client returns dict-like PostgrestAPIResponse

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
        result = await agent.run_analysis(
            query_str=request.query,
            market_domain_str=request.market_domain,
            question_str=request.question
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
async def get_kpis(state_id: Optional[str] = Query(None)): # Modified signature
    try:
        # Call the synchronous agent method in a thread pool
        kpis_data = await run_in_threadpool(agent.get_kpis, state_id=state_id) # Changed variable name
        return {
            "success": True,
            "data": kpis_data, # Use new variable name
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"KPI error (state_id: {state_id}): {str(e)}")
        # Consider adding traceback for more detailed logging if not too verbose for user
        raise HTTPException(status_code=500, detail=f"Error fetching KPI data: {str(e)}")

@app.get("/competitors")
async def get_competitors(state_id: Optional[str] = Query(None)): # Modified signature
    try:
        # Call the synchronous agent method in a thread pool
        competitors_data = await run_in_threadpool(agent.get_competitors, state_id=state_id) # Changed variable name
        return {
            "success": True,
            "data": competitors_data, # Use new variable name
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Competitors error (state_id: {state_id}): {str(e)}")
        # Consider adding traceback for more detailed logging if not too verbose for user
        raise HTTPException(status_code=500, detail=f"Error fetching competitor data: {str(e)}")

@app.get("/trends")
async def get_trends(state_id: Optional[str] = Query(None)): # Modified signature
    try:
        trends_data = await run_in_threadpool(agent.get_trends, state_id=state_id) # Changed variable name
        return {
            "success": True,
            "data": trends_data, # Use new variable name
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Trends error (state_id: {state_id}): {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching trends data: {str(e)}")

@app.get("/customer-insights")
async def get_customer_insights(state_id: Optional[str] = Query(None)): # Modified signature
    try:
        insights_data = await run_in_threadpool(agent.get_customer_insights, state_id=state_id) # Changed variable name
        return {
            "success": True,
            "data": insights_data, # Use new variable name
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Customer insights error (state_id: {state_id}): {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching customer insights data: {str(e)}")

@app.post("/chat", response_model=ChatResponse)
async def handle_chat(request: ChatRequest):
    try:
        logger.info(f"Received chat request for session_id: {request.session_id}")

        response_text = await agent.chat(
            message=request.message,
            session_id=request.session_id,
            history=request.history
        )

        return ChatResponse(
            success=True,
            response=response_text,
            session_id=request.session_id,
            timestamp=datetime.now().isoformat()
        )

    except Exception as e:
        logger.error(f"Chat error for session_id {request.session_id}: {str(e)}")
        # Consider if you want to expose full error detail or a generic message
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error processing chat message: {str(e)}")

# --- Data Sources CRUD Endpoints ---

@app.post("/data-sources", response_model=DataSourceResponse, status_code=status.HTTP_201_CREATED)
async def create_data_source(
    source_data: DataSourceCreate,
    current_user: Annotated[SupabaseUser, Depends(get_current_user)]
):
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database service not available")

    new_source_id = str(uuid.uuid4())
    db_data = {
        "id": new_source_id,
        "user_id": current_user.id,
        "name": source_data.name,
        "type": source_data.type,
        "config": source_data.config,
        "description": source_data.description,
        "category": source_data.category,
        "status": "active", # Default status
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    try:
        result = await run_in_threadpool(supabase.table("data_sources").insert(db_data).execute)
        if not result.data: # Check if data is empty or if there's an error attribute
             error_detail = result.error.message if hasattr(result, 'error') and result.error else "Insert failed, no data returned"
             logger.error(f"Failed to create data source in Supabase: {error_detail} - Data sent: {db_data}")
             raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to create data source: {error_detail}")

        created_item = result.data[0]
        return DataSourceResponse(**created_item)
    except Exception as e:
        logger.error(f"Error creating data source: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@app.get("/data-sources", response_model=List[DataSourceResponse])
async def list_data_sources(
    current_user: Annotated[SupabaseUser, Depends(get_current_user)]
):
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database service not available")
    try:
        result = await run_in_threadpool(
            supabase.table("data_sources").select("*").eq("user_id", current_user.id).execute
        )
        return [DataSourceResponse(**item) for item in result.data]
    except Exception as e:
        logger.error(f"Error listing data sources: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@app.get("/data-sources/{source_id}", response_model=DataSourceResponse)
async def get_data_source(
    source_id: str,
    current_user: Annotated[SupabaseUser, Depends(get_current_user)]
):
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database service not available")
    try:
        result = await run_in_threadpool(
            supabase.table("data_sources").select("*").eq("id", source_id).eq("user_id", current_user.id).single().execute
        ) # Use .single() to get one record or error
        if not result.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Data source not found or access denied")
        return DataSourceResponse(**result.data)
    except HTTPException: # Re-raise HTTPException if it's 404
        raise
    except Exception as e: # Catch other errors, e.g. PostgrestAPIError if .single() fails not due to 0 rows
        logger.error(f"Error fetching data source {source_id}: {e}")
        # Check if the error indicates that zero rows were returned by .single()
        if "JSON object requested, multiple (or no) rows returned" in str(e) or "Expected one row" in str(e):
             raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Data source not found or access denied")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@app.put("/data-sources/{source_id}", response_model=DataSourceResponse)
async def update_data_source(
    source_id: str,
    source_update_data: DataSourceUpdate,
    current_user: Annotated[SupabaseUser, Depends(get_current_user)]
):
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database service not available")

    # First, verify ownership and existence
    try:
        existing_source_raw = await run_in_threadpool(
            supabase.table("data_sources").select("id").eq("id", source_id).eq("user_id", current_user.id).single().execute
        )
        if not existing_source_raw.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Data source not found or access denied for update")
    except Exception as e: # Handles cases where .single() fails
        logger.error(f"Error verifying data source {source_id} for update: {e}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Data source not found or error verifying ownership")

    update_payload = source_update_data.model_dump(exclude_unset=True)
    if not update_payload:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No update data provided")

    update_payload["updated_at"] = datetime.now(timezone.utc).isoformat()

    try:
        result = await run_in_threadpool(
            supabase.table("data_sources").update(update_payload).eq("id", source_id).eq("user_id", current_user.id).execute
        )
        if not result.data:
             error_detail = result.error.message if hasattr(result, 'error') and result.error else "Update failed, no data returned"
             logger.error(f"Failed to update data source {source_id} in Supabase: {error_detail}")
             raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to update data source: {error_detail}")

        return DataSourceResponse(**result.data[0])
    except Exception as e:
        logger.error(f"Error updating data source {source_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@app.delete("/data-sources/{source_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_data_source(
    source_id: str,
    current_user: Annotated[SupabaseUser, Depends(get_current_user)]
):
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database service not available")

    # Verify ownership before deleting
    try:
        existing_source_raw = await run_in_threadpool(
            supabase.table("data_sources").select("id", count="exact").eq("id", source_id).eq("user_id", current_user.id).execute
        )
        if existing_source_raw.count == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Data source not found or access denied for delete")
    except Exception as e:
        logger.error(f"Error verifying data source {source_id} for delete: {e}")
        # This might also catch PostgrestAPIError if the query itself fails for other reasons
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Error verifying data source ownership or source not found")

    try:
        await run_in_threadpool(
            supabase.table("data_sources").delete().eq("id", source_id).eq("user_id", current_user.id).execute
        )
        # No content returned for 204, so no explicit return needed
    except Exception as e:
        logger.error(f"Error deleting data source {source_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
