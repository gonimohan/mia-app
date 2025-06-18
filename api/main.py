from fastapi import FastAPI, HTTPException, Query, Depends, Header, status
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse # Added for serving files
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Annotated
import asyncio
import logging
from datetime import datetime, timezone
import os
import uuid # For generating IDs if needed, and for type hints
import httpx # Added for making external API calls
import traceback # For logging stack traces

# Import our agent logic
from agent_logic import MarketIntelligenceAgent, get_supabase_client # Assuming get_supabase_client is robust for auth and db ops

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Market Intelligence Agent API", version="1.0.0")

# In-memory store for sync statuses
# Key: user_id, Value: Dict[str, Dict[str, Any]] where inner key is source_name
sync_statuses_store: Dict[str, Dict[str, Any]] = {}

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

class DataSourceTestResponse(BaseModel): # Ensuring this model is defined
    test_successful: bool
    message: str
    status_code_from_service: Optional[int] = None
    tested_service_type: str

class SyncDataRequest(BaseModel):
    sources: List[str] # List of data source names (matching 'name' field in DB)
    market_domain: Optional[str] = "general"
    sync_type: Optional[str] = "full" # "full" or "incremental"
    api_keys: Dict[str, Optional[str]] # Bundle of API keys from Next.js server env

class SyncStatusResponseItem(BaseModel):
    source: str
    status: str
    progress: int
    message: Optional[str] = None
    last_update: str

class AllSyncStatusesResponse(BaseModel):
    statuses: List[SyncStatusResponseItem]
    last_global_sync_attempt_details_available: bool

class UpdateProfileRequest(BaseModel):
    full_name: str

class AnalysisStateSummary(BaseModel):
    state_id: str
    market_domain: Optional[str] = None
    query: Optional[str] = None
    created_at: str # Will be string from DB, or FastAPI will convert datetime object
    user_id: Optional[str] = None # Good to have for verification/debugging
    report_filename: Optional[str] = None # Placeholder for now
    status: Optional[str] = None # Placeholder for now

class DownloadableFile(BaseModel):
    category: str
    filename: str
    description: Optional[str] = None

class StateDownloadsResponse(BaseModel):
    state_id: str
    query: Optional[str] = None
    market_domain: Optional[str] = None
    created_at: str
    files: List[DownloadableFile]

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
async def analyze_market(
    request: AnalysisRequest,
    current_user: Annotated[SupabaseUser, Depends(get_current_user)] # Added authentication
):
    try:
        logger.info(f"Received analysis request for user {current_user.id}: {request.query}")
        
        # Run the analysis
        result = await agent.run_analysis(
            query_str=request.query,
            market_domain_str=request.market_domain,
            question_str=request.question,
            user_id=current_user.id  # Pass the authenticated user's ID
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
async def handle_chat(
    request: ChatRequest,
    current_user: Annotated[SupabaseUser, Depends(get_current_user)] # Added authentication
):
    try:
        logger.info(f"Received chat request for session_id: {request.session_id}, UserID: {current_user.id}") # Log UserID

        response_text = await agent.chat(
            message=request.message,
            session_id=request.session_id,
            history=request.history,
            user_id=current_user.id  # Pass the authenticated user's ID
        )

        return ChatResponse(
            success=True,
            response=response_text,
            session_id=request.session_id,
            timestamp=datetime.now().isoformat()
        )

    except Exception as e:
        logger.error(f"Chat error for session_id {request.session_id}, UserID: {current_user.id}: {str(e)}") # Log UserID in error
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

# --- Test Connection Helper Functions ---
async def test_tavily_connection(api_key: str, client: httpx.AsyncClient):
    try:
        response = await client.post(
            "https://api.tavily.com/search",
            json={"api_key": api_key, "query": "test connection", "search_depth": "basic", "max_results": 1},
            timeout=10
        )
        if 200 <= response.status_code < 300:
            return {"success": True, "message": "Tavily connection successful.", "status_code": response.status_code}
        elif response.status_code == 401 or response.status_code == 403:
            return {"success": False, "message": "Tavily API key is invalid or unauthorized.", "status_code": response.status_code}
        else:
            # Return limited length of response text to avoid overly long messages
            return {"success": False, "message": f"Tavily test failed. Status: {response.status_code}, Response: {response.text[:200]}", "status_code": response.status_code}
    except httpx.TimeoutException:
        return {"success": False, "message": "Tavily connection test timed out.", "status_code": None}
    except Exception as e:
        return {"success": False, "message": f"Tavily test connection error: {str(e)}", "status_code": None}

async def test_newsapi_connection(api_key: str, client: httpx.AsyncClient):
    try:
        response = await client.get(
            f"https://newsapi.org/v2/top-headlines?q=test&apiKey={api_key}&pageSize=1",
            timeout=10
        )
        if 200 <= response.status_code < 300:
            return {"success": True, "message": "NewsAPI connection successful.", "status_code": response.status_code}
        elif response.status_code == 401 or response.status_code == 403: # Common for invalid key
            return {"success": False, "message": "NewsAPI key is invalid or unauthorized.", "status_code": response.status_code}
        else:
            return {"success": False, "message": f"NewsAPI test failed. Status: {response.status_code}, Response: {response.text[:200]}", "status_code": response.status_code}
    except httpx.TimeoutException:
        return {"success": False, "message": "NewsAPI connection test timed out.", "status_code": None}
    except Exception as e:
        return {"success": False, "message": f"NewsAPI test connection error: {str(e)}", "status_code": None}

async def test_financialmodelingprep_connection(api_key: str, client: httpx.AsyncClient):
    try:
        response = await client.get(
            f"https://financialmodelingprep.com/api/v3/profile/AAPL?apikey={api_key}", # Using a common symbol like AAPL
            timeout=10
        )
        if 200 <= response.status_code < 300:
            data = response.json()
            # FMP might return 200 but with an error message in the JSON for invalid keys
            if isinstance(data, list) and data and "Error Message" in data[0]:
                 return {"success": False, "message": f"FMP API Error: {data[0]['Error Message']}", "status_code": response.status_code}
            if isinstance(data, dict) and data.get("Error Message"): # Check for error message in dict response too
                 return {"success": False, "message": f"FMP API Error: {data['Error Message']}", "status_code": response.status_code}
            return {"success": True, "message": "Financial Modeling Prep connection successful.", "status_code": response.status_code}
        elif response.status_code == 401 or response.status_code == 403: # Some APIs might use these for invalid keys
            return {"success": False, "message": "Financial Modeling Prep API key is invalid or unauthorized.", "status_code": response.status_code}
        else:
            return {"success": False, "message": f"Financial Modeling Prep test failed. Status: {response.status_code}, Response: {response.text[:200]}", "status_code": response.status_code}
    except httpx.TimeoutException:
        return {"success": False, "message": "Financial Modeling Prep connection test timed out.", "status_code": None}
    except Exception as e:
        return {"success": False, "message": f"Financial Modeling Prep test connection error: {str(e)}", "status_code": None}

async def test_alphavantage_connection(api_key: str, client: httpx.AsyncClient):
    try:
        # Using a common function like OVERVIEW and a common symbol like IBM
        response = await client.get(
            f"https://www.alphavantage.co/query?function=OVERVIEW&symbol=IBM&apikey={api_key}",
            timeout=15 # Alpha Vantage can be a bit slower
        )
        if 200 <= response.status_code < 300:
            data = response.json()
            # Alpha Vantage often returns errors/info within the JSON response even on 200 OK
            if data.get("Error Message"): # For invalid API key or symbol
                return {"success": False, "message": f"Alpha Vantage API Error: {data['Error Message']}", "status_code": response.status_code}
            if data.get("Information"): # For API call frequency limits
                 return {"success": False, "message": f"Alpha Vantage API Info: {data['Information']}", "status_code": response.status_code}
            if not data or (isinstance(data, dict) and not data.get("Symbol")): # Empty response or no symbol means it likely failed
                 return {"success": False, "message": "Alpha Vantage test failed: Unexpected response structure (No symbol data).", "status_code": response.status_code}
            return {"success": True, "message": "Alpha Vantage connection successful.", "status_code": response.status_code}
        # Alpha Vantage doesn't typically use 401 for invalid keys; errors are in the JSON.
        else: # For actual HTTP errors like 5xx
            return {"success": False, "message": f"Alpha Vantage test failed. Status: {response.status_code}, Response: {response.text[:200]}", "status_code": response.status_code}
    except httpx.TimeoutException:
        return {"success": False, "message": "Alpha Vantage connection test timed out.", "status_code": None}
    except Exception as e:
        return {"success": False, "message": f"Alpha Vantage test connection error: {str(e)}", "status_code": None}

@app.post("/data-sources/{source_id}/test", response_model=DataSourceTestResponse)
async def test_data_source_connection(
    source_id: str,
    current_user: Annotated[SupabaseUser, Depends(get_current_user)]
):
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database service not available")

    try:
        # Fetch more fields including 'name' for better matching
        source_res = await run_in_threadpool(
            supabase.table("data_sources").select("id, name, type, config, user_id, status").eq("id", source_id).single().execute
        )
    except Exception as e:
        logger.error(f"Error fetching data source {source_id} for test: {e}")
        if "JSON object requested, multiple (or no) rows returned" in str(e) or "PGRST116" in str(e): # PGRST116 for PostgREST no rows
             raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Data source not found.")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error fetching data source.")

    if not source_res.data: # Should be caught by the exception above, but as a safeguard
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Data source not found.")

    data_source = source_res.data
    if data_source["user_id"] != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to data source.")

    service_type_from_db = data_source.get("type", "").lower()
    service_name_from_db = data_source.get("name", "").lower()
    config = data_source.get("config", {})
    # Standardize API key access from config; assuming it's stored as 'apiKey'
    api_key_to_test = config.get("apiKey") if isinstance(config, dict) else None


    if not api_key_to_test:
        # If it's a type that typically requires an API key, it's an error.
        # Otherwise, for types like 'rss' or 'website_scrape', a key might not be needed.
        is_api_type = service_type_from_db == "api" or \
                      any(kw in service_name_from_db for kw in ["tavily", "newsapi", "financialmodelingprep", "alpha vantage", "mediastack", "serpapi", "google", "gemini"]) or \
                      any(kw in service_type_from_db for kw in ["tavily", "newsapi", "fmp", "alphavantage", "mediastack", "serpapi", "google", "gemini"])

        if is_api_type:
             logger.warning(f"API key not found in config for API-based service: ID {source_id}, Name {data_source.get('name')}, Type {data_source.get('type')}")
             return DataSourceTestResponse(
                test_successful=False,
                message="API key not found in data source configuration for this service type.",
                tested_service_type=data_source.get('name') or service_type_from_db
            )
        else: # For non-API types, or types where API key is optional
            return DataSourceTestResponse(
                test_successful=True,
                message=f"Test not applicable or API key not required for service type '{service_type_from_db}'. Connection considered okay.",
                tested_service_type=data_source.get('name') or service_type_from_db
            )

    test_result_data = {"success": False, "message": "Service test not implemented.", "status_code": None}
    effective_service_name_for_test = data_source.get('name', service_type_from_db) # For the response model

    async with httpx.AsyncClient() as client:
        # More specific matching based on common names or types
        if "tavily" in service_name_from_db or "tavily" in service_type_from_db:
            effective_service_name_for_test = "Tavily"
            test_result_data = await test_tavily_connection(api_key_to_test, client)
        elif "newsapi" in service_name_from_db or "news api" in service_name_from_db or "newsapi" in service_type_from_db : # "newsapi" is often in name
            effective_service_name_for_test = "NewsAPI"
            test_result_data = await test_newsapi_connection(api_key_to_test, client)
        elif "financialmodelingprep" in service_name_from_db or "fmp" in service_type_from_db:
            effective_service_name_for_test = "Financial Modeling Prep"
            test_result_data = await test_financialmodelingprep_connection(api_key_to_test, client)
        elif "alpha vantage" in service_name_from_db or "alphavantage" in service_type_from_db:
            effective_service_name_for_test = "Alpha Vantage"
            test_result_data = await test_alphavantage_connection(api_key_to_test, client)
        # Placeholder for MediaStack and SerpAPI - can be implemented similarly
        # elif "mediastack" in service_name_from_db or "mediastack" in service_type_from_db:
        #     effective_service_name_for_test = "MediaStack"
        #     # test_result_data = await test_mediastack_connection(api_key_to_test, client)
        # elif "serpapi" in service_name_from_db or "serpapi" in service_type_from_db:
        #     effective_service_name_for_test = "SerpAPI"
        #     # test_result_data = await test_serpapi_connection(api_key_to_test, client)
        elif service_type_from_db == "api": # Generic 'api' type if no specific handler matched
             logger.warning(f"No specific test implemented for API source: {data_source.get('name')}, type: {service_type_from_db}. Returning 'not implemented'.")
             return DataSourceTestResponse(
                test_successful=False, # Or True if we want to allow it but mark as not specifically tested
                message=f"Connection test not specifically implemented for this API provider ('{data_source.get('name')}'). Please verify configuration manually.",
                tested_service_type=effective_service_name_for_test
            )
        else: # Should ideally not be reached if is_api_type check above is robust
            logger.info(f"Service type '{service_type_from_db}' for source {source_id} does not match known API types for testing with an API key.")
            return DataSourceTestResponse(
                test_successful=True, # Default to true if it's not a known API type that needs key testing
                message=f"Test not applicable for service type '{service_type_from_db}'.",
                tested_service_type=effective_service_name_for_test
            )

    # Update data source status in DB based on test_result
    if not test_result_data["success"]:
        current_db_status = data_source.get("status", "active")
        new_db_status_to_set = current_db_status

        # If API key is invalid/unauthorized, and current status is not already 'error'
        if test_result_data.get("status_code") in [401, 403] and current_db_status != "error":
            new_db_status_to_set = "error"
            logger.warning(f"Data source {source_id} ({effective_service_name_for_test}) test failed due to invalid/unauthorized API key (HTTP {test_result_data.get('status_code')}). Current status: '{current_db_status}'. Setting to 'error'.")

            update_fields = {"status": new_db_status_to_set, "updated_at": datetime.now(timezone.utc).isoformat()}
            try:
                await run_in_threadpool(
                    supabase.table("data_sources").update(update_fields).eq("id", source_id).eq("user_id", current_user.id).execute
                )
            except Exception as e_update_status:
                logger.error(f"Failed to update data source {source_id} status to '{new_db_status_to_set}' after failed test: {e_update_status}")
        elif not test_result_data["success"]: # For other failures, just log, don't change status to 'error' unless specifically desired
             logger.warning(f"Data source {source_id} ({effective_service_name_for_test}) test failed: {test_result_data.get('message')} (HTTP {test_result_data.get('status_code')}). Current status: '{current_db_status}'. Status not changed.")
             # Could introduce a 'warning' or 'degraded' status here if needed.

    return DataSourceTestResponse(
        test_successful=test_result_data["success"],
        message=test_result_data["message"],
        status_code_from_service=test_result_data.get("status_code"),
        tested_service_type=effective_service_name_for_test
    )

@app.post("/sync-data")
async def handle_sync_data(
    request: SyncDataRequest,
    current_user: Annotated[SupabaseUser, Depends(get_current_user)]
):
    try:
        logger.info(f"Received sync data request for UserID: {current_user.id}, Sources: {request.sources}")

        # Initialize/Update store with "syncing" status immediately
        if current_user.id not in sync_statuses_store:
            sync_statuses_store[current_user.id] = {}

        current_time_iso = datetime.now(timezone.utc).isoformat()
        for source_name_to_sync in request.sources: # These are source names from frontend
             sync_statuses_store[current_user.id][source_name_to_sync] = {
                "status": "syncing",
                "progress": 10,
                "message": "Sync initiated...",
                "last_update": current_time_iso
            }

        sync_results = await agent.sync_data(
            user_id=current_user.id,
            sources_to_sync=request.sources,
            market_domain=request.market_domain,
            sync_type=request.sync_type,
            api_keys_bundle=request.api_keys
        )

        # Update store with final results from agent.sync_data
        final_update_time_iso = datetime.now(timezone.utc).isoformat()
        # agent.sync_data returns a dict where keys are the same source names passed in sources_to_sync
        for source_name, result_detail in sync_results.items():
            sync_statuses_store[current_user.id][source_name] = {
                "status": result_detail.get("status", "unknown"), # Should be "synced" or "error"
                "progress": 100 if result_detail.get("status") == "synced" else (0 if result_detail.get("status") == "error" else 10), # if still "syncing" keep 10, otherwise 0 for error.
                "message": result_detail.get("message", ""),
                "last_update": final_update_time_iso
            }

        return {"success": True, "message": "Sync process completed.", "details": sync_results}
    except Exception as e:
        logger.error(f"Sync data error for UserID {current_user.id}: {e}\n{traceback.format_exc()}")
        if current_user.id not in sync_statuses_store:
            sync_statuses_store[current_user.id] = {}
        error_time_iso = datetime.now(timezone.utc).isoformat()
        for source_name_to_sync in request.sources:
             sync_statuses_store[current_user.id][source_name_to_sync] = {
                "status": "error",
                "progress": 0,
                "message": f"Failed to complete sync process: {str(e)}",
                "last_update": error_time_iso
            }
        raise HTTPException(status_code=500, detail=f"Failed to sync data: {str(e)}")

@app.get("/sync-status", response_model=AllSyncStatusesResponse)
async def get_sync_status(current_user: Annotated[SupabaseUser, Depends(get_current_user)]):
    user_statuses = sync_statuses_store.get(current_user.id, {})

    response_items = []
    for source_name, status_detail in user_statuses.items():
        response_items.append(SyncStatusResponseItem(
            source=source_name,
            status=str(status_detail.get("status", "unknown")),
            progress=int(status_detail.get("progress", 0)),
            message=status_detail.get("message"),
            last_update=str(status_detail.get("last_update", "N/A"))
        ))

    return AllSyncStatusesResponse(
        statuses=response_items,
        last_global_sync_attempt_details_available=bool(user_statuses)
    )

if __name__ == "__main__":
    import uvicorn
    # Make sure to import traceback if not already at the top of the file for the logger.error call above.
    # import traceback
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)


# Needs to be after agent_logic import for list_user_analysis_states
# from agent_logic import list_user_analysis_states # This should already be covered by 'from agent_logic import ...'

@app.get("/analysis-states", response_model=List[AnalysisStateSummary])
async def get_analysis_states_for_user(
    current_user: Annotated[SupabaseUser, Depends(get_current_user)]
):
    try:
        # The list_user_analysis_states function is synchronous, so run in threadpool
        # It's defined in agent_logic.py and is assumed to be imported via 'from agent_logic import *' or similar
        # For clarity, ensure agent_logic.list_user_analysis_states is accessible.
        # If agent is an instance of MarketIntelligenceAgent, and list_user_analysis_states is a method:
        # raw_states = await run_in_threadpool(agent.list_user_analysis_states, user_id=current_user.id)
        # If it's a standalone function in agent_logic:
        from agent_logic import list_user_analysis_states # Explicit import for clarity here

        raw_states = await run_in_threadpool(list_user_analysis_states, user_id=current_user.id)

        # Transform data if necessary to match AnalysisStateSummary.
        # The current list_user_analysis_states returns keys that match well.
        # FastAPI will handle datetime to string conversion for created_at.
        # report_filename and status are placeholders for now.
        analysis_summaries = []
        for state_dict in raw_states:
            analysis_summaries.append(
                AnalysisStateSummary(
                    state_id=state_dict["state_id"],
                    market_domain=state_dict.get("market_domain"),
                    query=state_dict.get("query"),
                    created_at=state_dict["created_at"], # Expecting ISO string or datetime object
                    user_id=state_dict.get("user_id")
                    # report_filename and status are not yet populated by list_user_analysis_states
                )
            )
        return analysis_summaries
    except Exception as e:
        logger.error(f"Error fetching analysis states for UserID {current_user.id}: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Failed to fetch analysis states.")

@app.get("/analysis-states/{state_id}/downloads", response_model=StateDownloadsResponse)
async def get_state_downloads(
    state_id: str,
    current_user: Annotated[SupabaseUser, Depends(get_current_user)]
):
    try:
        from agent_logic import get_state_download_info # Explicit import

        # get_state_download_info is synchronous, run in threadpool
        download_info_dict = await run_in_threadpool(
            get_state_download_info,
            state_id=state_id,
            user_id=current_user.id
        )

        if not download_info_dict:
            raise HTTPException(status_code=404, detail="Analysis state not found or access denied.")

        # The dictionary returned by get_state_download_info should directly match StateDownloadsResponse
        return StateDownloadsResponse(**download_info_dict)

    except HTTPException: # Re-raise HTTPException (like 404)
        raise
    except Exception as e:
        logger.error(f"Error fetching download info for state {state_id}, UserID {current_user.id}: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Failed to fetch download information for the analysis state.")

@app.get("/analysis-states/{state_id}/downloads/{file_identifier}")
async def download_analysis_file(
    state_id: str,
    file_identifier: str,
    current_user: Annotated[SupabaseUser, Depends(get_current_user)]
):
    try:
        from agent_logic import get_download_file_path # Explicit import

        file_path = await run_in_threadpool(
            get_download_file_path,
            state_id=state_id,
            user_id=current_user.id,
            file_identifier=file_identifier
        )

        if not file_path:
            # get_download_file_path now includes logging for specific reasons (not found, security, not a file)
            raise HTTPException(status_code=404, detail="File not found, access denied, or path issue.")

        download_filename = os.path.basename(file_path)

        # FastAPI's FileResponse will attempt to guess media type from filename extension.
        # For explicit control or for files without extensions, you could add a 'media_type' argument.
        return FileResponse(path=file_path, filename=download_filename)

    except HTTPException: # Re-raise HTTPExceptions (e.g., 404 from above)
        raise
    except Exception as e:
        logger.error(f"Error processing download for file '{file_identifier}', state {state_id}, user {current_user.id}: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Could not process file download.")

@app.put("/users/me/profile")
async def update_user_profile(
    profile_update: UpdateProfileRequest,
    current_user: Annotated[SupabaseUser, Depends(get_current_user)]
):
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not available.") # Changed from 503 for consistency

    try:
        # Update auth.users table (user_metadata.full_name)
        auth_update_response = await run_in_threadpool(
            supabase.auth.update_user,
            attributes={'data': {'full_name': profile_update.full_name}} # 'data' is for user_metadata
        )
        updated_auth_user = auth_update_response.user
        if not updated_auth_user:
             # This path might not be typically hit if update_user itself raises an error on failure.
             # Depending on Supabase client version, error handling might differ.
             raise HTTPException(status_code=500, detail="Failed to update user profile in auth schema (no user returned).")

        # Update public.users table
        def _update_public_user_table():
            return (
                supabase.table("users")
                .update({
                    "name": profile_update.full_name,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                })
                .eq("id", current_user.id) # current_user.id is UUID string
                .execute()
            )
        public_users_update_response = await run_in_threadpool(_update_public_user_table)

        # Check for errors in public_users_update_response
        # Supabase-py v1: response object has .error attribute
        # Supabase-py v2: response object is a GoTrueAdminUserResponse or similar, error might be an exception
        # For Postgrest responses (table operations):
        if hasattr(public_users_update_response, 'error') and public_users_update_response.error:
            error_logger.error(f"Error updating public.users for UserID {current_user.id}: {public_users_update_response.error}")
            # Decide if this should be a partial success or full failure.
            # For now, log it but proceed if auth update was fine.
        elif hasattr(public_users_update_response, 'data') and not public_users_update_response.data:
            # This means the .eq("id", current_user.id) condition might not have found a row.
            # This could happen if the public.users row was not created on signup.
            error_logger.warning(f"No rows updated in public.users for UserID {current_user.id}. User might not exist in public.users, or name was the same.")

        logger.info(f"User profile updated for UserID: {current_user.id}. New name: {profile_update.full_name}")

        # Ensure the returned full_name is from the successfully updated auth user metadata
        auth_user_full_name = ""
        if updated_auth_user.user_metadata and isinstance(updated_auth_user.user_metadata, dict):
            auth_user_full_name = updated_auth_user.user_metadata.get('full_name', '')

        return {
            "message": "Profile updated successfully",
            "updated_user_details": {
                "full_name": auth_user_full_name, # Use the retrieved metadata
                "email": updated_auth_user.email
            }
        }

    except HTTPException: # Re-raise HTTPExceptions (e.g., from auth update if it raises one)
        raise
    except Exception as e:
        error_logger.error(f"Error updating profile for UserID {current_user.id}: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred while updating profile: {str(e)}")
