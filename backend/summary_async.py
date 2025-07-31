import asyncio
from summarizers.hf_korean import summarize_korean_sync
from summarizers.hf_english import summarize_english_sync

async def summarize_async(text: str, lang: str = "ko") -> str:
    loop = asyncio.get_event_loop()
    if lang == "ko":
        return await loop.run_in_executor(None, summarize_korean_sync, text)
    else:
        return await loop.run_in_executor(None, summarize_english_sync, text) 