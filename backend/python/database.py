import os
import threading
from datetime import datetime, date

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "pgmanagement")

mongo_client = None
mongo_db = None
use_mongo = False

_memory_store = {}
_store_lock = threading.Lock()

class InMemoryCollection:
    def __init__(self, name):
        self.name = name
        with _store_lock:
            if name not in _memory_store:
                _memory_store[name] = []

    def insert_one(self, doc):
        from bson import ObjectId
        doc = dict(doc)
        if "_id" not in doc:
            doc["_id"] = ObjectId()
        with _store_lock:
            _memory_store[self.name].append(doc)
        class Result:
            inserted_id = doc["_id"]
        return Result()

    def find_one(self, filter_q=None, projection=None):
        if filter_q is None:
            filter_q = {}
        with _store_lock:
            for doc in _memory_store.get(self.name, []):
                if self._matches(doc, filter_q):
                    if projection and "password" in projection:
                        return {k: v for k, v in doc.items() if k != "password"}
                    return dict(doc)
        return None

    def find(self, filter_q=None):
        if filter_q is None:
            filter_q = {}
        results = []
        with _store_lock:
            for doc in _memory_store.get(self.name, []):
                if self._matches(doc, filter_q):
                    results.append(dict(doc))
        class Cursor:
            def __init__(self, data):
                self.data = data
            def sort(self, *args):
                return self
            def limit(self, n):
                if n:
                    self.data = self.data[:n]
                return self
            def __iter__(self):
                return iter(self.data)
        return Cursor(results)

    def count_documents(self, filter_q=None):
        if filter_q is None:
            filter_q = {}
        count = 0
        with _store_lock:
            for doc in _memory_store.get(self.name, []):
                if self._matches(doc, filter_q):
                    count += 1
        return count

    def update_one(self, filter_q, update):
        with _store_lock:
            for doc in _memory_store.get(self.name, []):
                if self._matches(doc, filter_q):
                    if "$set" in update:
                        doc.update(update["$set"])
                    return True
        return False

    def delete_one(self, filter_q):
        with _store_lock:
            for i, doc in enumerate(_memory_store.get(self.name, [])):
                if self._matches(doc, filter_q):
                    _memory_store[self.name].pop(i)
                    return True
        return False

    def aggregate(self, pipeline):
        from collections import defaultdict
        data = list(_memory_store.get(self.name, []))
        for stage in pipeline:
            if "$match" in stage:
                data = [d for d in data if self._matches(d, stage["$match"])]
            elif "$group" in stage:
                groups = defaultdict(list)
                for d in data:
                    key = d.get(stage["$group"].get("_id", ""))
                    groups[key].append(d)
                data = []
                for key, items in groups.items():
                    result = {"_id": key}
                    for field, expr in stage["$group"].items():
                        if field == "_id":
                            continue
                        if "$sum" in expr:
                            result[field.replace("$", "")] = sum(
                                item.get(expr["$sum"] if isinstance(expr["$sum"], str) else "", 1)
                                for item in items
                            )
                    data.append(result)
            elif "$sort" in stage:
                key = list(stage["$sort"].keys())[0]
                data.sort(key=lambda x: x.get(key, 0), reverse=stage["$sort"][key] == -1)
        return data

    def _matches(self, doc, filter_q):
        for key, value in filter_q.items():
            if key == "_id":
                if str(doc.get("_id")) != str(value):
                    return False
            elif isinstance(value, dict):
                if "$regex" in value:
                    import re
                    if not re.search(value["$regex"], str(doc.get(key, "")), re.IGNORECASE if value.get("$options", "").lower() == "i" else 0):
                        return False
                elif "$gte" in value:
                    if doc.get(key, "") < value["$gte"]:
                        return False
                elif "$lte" in value:
                    val = doc.get(key)
                    if val is None or val > value["$lte"]:
                        return False
                elif "$in" in value:
                    if doc.get(key) not in value["$in"]:
                        return False
                elif "$ne" in value:
                    if doc.get(key) == value["$ne"]:
                        return False
            else:
                if doc.get(key) != value:
                    return False
        return True

def _init_mongo():
    global mongo_client, mongo_db, use_mongo
    try:
        from pymongo import MongoClient
        from pymongo.server_api import ServerApi
        mongo_client = MongoClient(MONGO_URI, server_api=ServerApi("1"), serverSelectionTimeoutMS=3000)
        mongo_client.admin.command("ping")
        mongo_db = mongo_client[DB_NAME]
        use_mongo = True
        print(f"Connected to MongoDB: {DB_NAME}")
    except Exception as e:
        print(f"MongoDB unavailable ({e}), using in-memory storage")
        use_mongo = False

_init_mongo()

def get_collection(name):
    global mongo_db
    if use_mongo and mongo_db is not None:
        return mongo_db[name]
    return InMemoryCollection(name)
