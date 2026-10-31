import os
import uuid
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance, PointStruct, Filter, FieldCondition, MatchValue, FilterSelector, IsEmptyCondition, PayloadField
from embeddings import get_embedding

load_dotenv()

client = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY")
)

COLLECTION_NAME = "study_notes"

def create_collection_if_not_exists():
    collections = client.get_collections().collections
    existing_names = [c.name for c in collections]

    if COLLECTION_NAME not in existing_names:
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=384, distance=Distance.COSINE)
        )

    client.create_payload_index(
        collection_name=COLLECTION_NAME,
        field_name="doc_type",
        field_schema="keyword",
    )
    client.create_payload_index(
           collection_name=COLLECTION_NAME,
           field_name="source_file",
           field_schema="keyword",
    )
def store_chunks(chunks: list[str], embeddings: list[list[float]], source_file: str, doc_type: str = "notes"):
    points = [
        PointStruct(
            id=str(uuid.uuid4()),
            vector=embeddings[i],
            payload={
                "text": chunks[i],
                "source_file": source_file,
                "doc_type": doc_type,
                "chunk_id": i,
            },
        )
        for i in range(len(chunks))
    ]
    client.upsert(collection_name=COLLECTION_NAME, points=points)

def search_chunks(query: str, top_k: int = 5, min_score: float = 0.4, doc_type: str | None = None):
    query_embedding = get_embedding(query)

    query_filter = None
    if doc_type:
        query_filter = Filter(
            must=[FieldCondition(key="doc_type", match=MatchValue(value=doc_type))]
        )

    results = client.query_points(
        collection_name=COLLECTION_NAME,
        query=query_embedding,
        limit=top_k,
        query_filter=query_filter,
    ).points
    return [r.payload["text"] for r in results if r.score >= min_score]

def search_chunks_with_scores(query: str, top_k: int = 5):
    query_embedding = get_embedding(query)
    results = client.query_points(
        collection_name=COLLECTION_NAME,
        query=query_embedding,
        limit=top_k
    ).points
    return [
        {"score": round(r.score, 3), "text": r.payload["text"]}
        for r in results
    ]
def list_documents() -> list[dict]:
    documents = {}
    offset = None
    while True:
        points, offset = client.scroll(
            collection_name=COLLECTION_NAME,
            limit=256,
            offset=offset,
            with_payload=["source_file", "doc_type"],
            with_vectors=False,
        )
        for p in points:
            name = p.payload.get("source_file") or "Unknown file (uploaded before tracking)"
            doc_type = p.payload.get("doc_type", "notes")
            key = (name, doc_type)
            if key not in documents:
                documents[key] = {"source_file": name, "doc_type": doc_type, "chunks": 0}
            documents[key]["chunks"] += 1
        if offset is None:
            break
    return sorted(documents.values(), key=lambda d: (d["doc_type"], d["source_file"]))
def delete_document(source_file: str, doc_type: str) -> None:
    if source_file.startswith("Unknown file"):
        must = [IsEmptyCondition(is_empty=PayloadField(key="source_file"))]
    else:
        must = [
            FieldCondition(key="source_file", match=MatchValue(value=source_file)),
            FieldCondition(key="doc_type", match=MatchValue(value=doc_type)),
        ]
    client.delete(
        collection_name=COLLECTION_NAME,
        points_selector=FilterSelector(filter=Filter(must=must)),
    )