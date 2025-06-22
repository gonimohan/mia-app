import os
from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.database import Database
from bson import ObjectId
from typing import Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv() # Load environment variables from .env file

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
MONGODB_DATABASE_NAME = os.getenv("MONGODB_DATABASE_NAME", "document_intelligence_db")
DOCUMENTS_COLLECTION_NAME = "documents"

_db_client: Optional[MongoClient] = None
_db: Optional[Database] = None

def connect_to_mongo():
    """Initializes the MongoDB client and database object."""
    global _db_client, _db
    if _db_client is None:
        print(f"Connecting to MongoDB at {MONGODB_URI}")
        _db_client = MongoClient(MONGODB_URI)
        _db = _db_client[MONGODB_DATABASE_NAME]
        # You might want to add error handling for connection issues here
        print(f"Connected to database '{MONGODB_DATABASE_NAME}'")

def close_mongo_connection():
    """Closes the MongoDB client connection."""
    global _db_client
    if _db_client:
        _db_client.close()
        _db_client = None
        _db = None
        print("MongoDB connection closed.")

def get_db() -> Database:
    """Returns the MongoDB database object. Connects if not already connected."""
    if _db is None:
        connect_to_mongo()
    return _db

def get_documents_collection() -> Collection:
    """Returns the documents collection object."""
    db = get_db()
    return db[DOCUMENTS_COLLECTION_NAME]

def insert_document(data: Dict[str, Any]) -> str:
    """
    Inserts a new document into the documents collection.
    Returns the string representation of the inserted document's ObjectId.
    """
    collection = get_documents_collection()
    result = collection.insert_one(data)
    return str(result.inserted_id)

def get_document_by_id(document_id_str: str) -> Optional[Dict[str, Any]]:
    """
    Retrieves a document by its ObjectId string.
    Returns the document dict or None if not found.
    """
    collection = get_documents_collection()
    try:
        object_id = ObjectId(document_id_str)
        return collection.find_one({"_id": object_id})
    except Exception: # Handles invalid ObjectId format
        return None

def update_document_by_id(document_id_str: str, updates: Dict[str, Any]) -> bool:
    """
    Updates a document by its ObjectId string.
    Returns True if update was successful (matched and modified/or just matched), False otherwise.
    """
    collection = get_documents_collection()
    try:
        object_id = ObjectId(document_id_str)
        result = collection.update_one({"_id": object_id}, {"$set": updates})
        return result.matched_count > 0
    except Exception: # Handles invalid ObjectId format
        return False

# Example usage (optional, for testing this file directly)
if __name__ == "__main__":
    connect_to_mongo()

    # Example: Insert
    # doc_id = insert_document({
    #     "filename": "test.txt",
    #     "original_filename": "test.txt",
    #     "status": "uploaded",
    #     "upload_time": "2023-01-01T00:00:00Z"
    # })
    # print(f"Inserted document with ID: {doc_id}")

    # Example: Get
    # if doc_id:
    #     doc = get_document_by_id(doc_id)
    #     print(f"Retrieved document: {doc}")

    # Example: Update
    # if doc_id:
    #     updated = update_document_by_id(doc_id, {"status": "processing", "text": "sample text"})
    #     print(f"Update successful: {updated}")
    #     doc = get_document_by_id(doc_id)
    #     print(f"Updated document: {doc}")

    close_mongo_connection()
