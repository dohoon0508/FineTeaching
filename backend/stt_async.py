import whisper
import asyncio
import torch

model = whisper.load_model("medium")  # 'small', 'medium' 등 선택 가능

async def transcribe_audio_async(file_path: str) -> str:
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, model.transcribe, file_path)
    return result["text"] 