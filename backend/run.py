#!/usr/bin/env python3
"""
FineTeaching Backend Server
FastAPI 기반 음성 처리 및 요약 서비스
"""

import uvicorn
from main import app

if __name__ == "__main__":
    print("🎯 FineTeaching Backend Server 시작 중...")
    print("📡 서버 주소: http://localhost:8000")
    print("📚 API 문서: http://localhost:8000/docs")
    print("🔄 서버 중지: Ctrl+C")
    print("-" * 50)
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        reload=True,
        log_level="info"
    ) 