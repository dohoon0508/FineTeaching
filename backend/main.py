from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from stt_async import transcribe_audio_async
from summary_async import summarize_async
import os
import aiofiles

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001"],  # 프론트엔드 주소
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload-audio/")
async def upload_audio(file: UploadFile = File(...), lang: str = Form("ko")):
    # 1. 비동기적으로 파일 저장
    os.makedirs("temp", exist_ok=True)
    temp_path = f"temp/{file.filename}"

    async with aiofiles.open(temp_path, "wb") as out_file:
        content = await file.read()
        await out_file.write(content)

    # 2. STT 처리 (Whisper)
    transcript = await transcribe_audio_async(temp_path)

    # 3. 요약 처리
    summary = await summarize_async(transcript, lang)

    # 임시 파일 삭제
    os.remove(temp_path)

    return {"transcript": transcript, "summary": summary}

@app.get("/")
async def root():
    return {"message": "FineTeaching Backend API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 