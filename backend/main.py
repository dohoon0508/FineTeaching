import os, tempfile, shutil, re
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.post("/stt")
async def stt(
    file: UploadFile = File(...),
    ui_lang: str = Form("ko")
):
    with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{file.filename}") as tmp:
        shutil.copyfileobj(file.file, tmp)
        audio_path = tmp.name
    tx = client.audio.transcriptions.create(
        model="gpt-4o-transcribe",  # 고품질 모델
        file=open(audio_path, "rb"),
        response_format="json"
    )
    transcript = tx.text
    # 선택 언어로 번역 (안내문구 없이 번역 결과만 반환하도록 프롬프트 명확화)
    if ui_lang == "ko":
        sys = (
            "You are a professional translator into Korean. "
            "Translate the following text into natural Korean. "
            "Do NOT add any explanations, introductions, or extra comments. "
            "Return ONLY the translated content itself."
        )
        tgt = "Korean"
    else:
        sys = (
            "You are a professional translator into English. "
            "Translate the following text into natural English. "
            "Do NOT add any explanations, introductions, or extra comments. "
            "Return ONLY the translated content itself."
        )
        tgt = "English"
    tr = client.responses.create(
        model="gpt-4o",  # 더 강력한 LLM
        input=[
            {"role":"system","content":sys},
            {"role":"user","content":f"Translate to {tgt}:\n\n{transcript}"}
        ]
    )
    out = tr.output[0].content[0].text if hasattr(tr, "output") else transcript
    # 후처리: 안내문구 자동 제거
    out = re.sub(r"^(Sure, )?(here is the translation.*?:\s*)?-*\n*", "", out, flags=re.IGNORECASE)
    return {"language": ui_lang, "transcript": out}

@app.post("/summarize")
async def summarize(
    text: str = Form(...),
    target_lang: str = Form("ko"),
    lecture_title: str = Form("")
):
    # 더 구체적인 프롬프트: 과목명 포함, 항목별, 표/번호/구조화, 예시/근거/결론/액션아이템 등
    if target_lang == "en":
        sys = (
            f"This lecture is about '{lecture_title}'. "
            "You are an expert at organizing lecture transcripts. Do not omit important content. "
            "Instead, organize the text into clear, structured sections with headings (e.g., Main Topic, Key Points, Evidence, Examples, Conclusion, Action Items). "
            "Use bullet points, numbering, or tables if appropriate. Do not summarize by shortening, but by structuring and clarifying."
        )
    else:
        sys = (
            f"이 강의는 '{lecture_title}'에 관한 것입니다. "
            "너는 강의 내용을 체계적으로 정리하는 전문가야. 중요한 내용을 생략하지 말고, "
            "항목별(예: 주제, 핵심, 근거, 예시, 결론, 액션아이템 등)로 명확하게 정돈해줘. "
            "표, 번호, 불릿 등 구조화된 형태로 작성하고, 단순 요약(축약)하지 말고, 구조화/정돈 중심으로 작성해."
        )
    resp = client.responses.create(
        model="gpt-4o",  # 더 강력한 LLM
        input=[
            {"role":"system","content":sys},
            {"role":"user","content":f"[강의 원문]\n{text}"}
        ]
    )
    out = resp.output[0].content[0].text if hasattr(resp, "output") else ""
    return {"summary": out}

@app.post("/quiz")
async def quiz(
    text: str = Form(...),
    target_lang: str = Form("ko"),
    lecture_title: str = Form("")
):
    # 객관식 문제 5개 생성 (더 안정적인 프롬프트)
    if target_lang == "en":
        sys = (
            f"You are creating multiple choice questions for a lecture about '{lecture_title}'. "
            "Create exactly 5 questions with 4 options each (A, B, C, D). "
            "Each question should test understanding of key concepts from the lecture. "
            "Return ONLY a valid JSON array with this exact structure:\n"
            "[\n"
            '  {"id": 1, "question": "Question text?", "options": {"A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D"}, "correct": "A", "explanation": "Explanation why A is correct"},\n'
            "]\n"
            "Do not include any other text or formatting."
        )
    else:
        sys = (
            f"너는 '{lecture_title}' 강의에 대한 객관식 문제를 만드는 교육 전문가야. "
            "정확히 5개의 문제를 만들어줘. 각 문제는 4지선다(A, B, C, D)야. "
            "각 문제는 강의의 핵심 개념에 대한 이해를 평가해야 해. "
            "다음 JSON 배열 형식으로만 반환해줘:\n"
            "[\n"
            '  {"id": 1, "question": "문제 텍스트?", "options": {"A": "보기 A", "B": "보기 B", "C": "보기 C", "D": "보기 D"}, "correct": "A", "explanation": "A가 정답인 이유 설명"},\n'
            "]\n"
            "다른 텍스트나 형식은 포함하지 말고, JSON 배열만 반환해줘."
        )
    
    resp = client.responses.create(
        model="gpt-4o",
        input=[
            {"role":"system","content":sys},
            {"role":"user","content":f"[강의 내용]\n{text}"}
        ]
    )
    out = resp.output[0].content[0].text if hasattr(resp, "output") else ""
    
    # JSON 파싱 시도
    try:
        import json
        questions = json.loads(out)
        return {"questions": questions}
    except:
        # JSON 파싱 실패 시 빈 배열 반환
        return {"questions": []}

@app.post("/submit-answer")
async def submit_answer(
    question_id: int = Form(...),
    selected_answer: str = Form(...),
    correct_answer: str = Form(...),
    explanation: str = Form(...),
    target_lang: str = Form("ko")
):
    # 답안 제출 결과 및 해설 반환
    is_correct = selected_answer == correct_answer
    
    if target_lang == "ko":
        result_message = "정답입니다!" if is_correct else "틀렸습니다."
    else:
        result_message = "Correct!" if is_correct else "Incorrect."
    
    return {
        "is_correct": is_correct,
        "result_message": result_message,
        "explanation": explanation,
        "correct_answer": correct_answer
    }
