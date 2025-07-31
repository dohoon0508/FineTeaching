# FineTeaching Backend

FastAPI 기반 음성 처리 및 요약 서비스

## 🚀 설치 및 실행

### 1. 의존성 설치
```bash
pip install -r requirements.txt
```

### 2. 서버 실행
```bash
python run.py
```

또는
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 📡 API 엔드포인트

### POST /upload-audio/
음성 파일을 업로드하여 STT 및 요약 처리

**파라미터:**
- `file`: 음성 파일 (MP3, M4A, WAV)
- `lang`: 언어 선택 ("ko" 또는 "en")

**응답:**
```json
{
  "transcript": "음성 원문",
  "summary": "요약된 내용"
}
```

## 🛠️ 기술 스택

- **FastAPI**: 비동기 웹 프레임워크
- **Whisper**: OpenAI 음성 인식
- **Transformers**: Hugging Face 요약 모델
- **KoBART**: 한국어 요약 모델
- **BART**: 영어 요약 모델

## 📁 프로젝트 구조

```
backend/
├── main.py                 # FastAPI 메인 앱
├── stt_async.py           # Whisper STT 비동기 처리
├── summary_async.py       # 요약 비동기 처리
├── summarizers/
│   ├── hf_korean.py       # 한국어 KoBART 요약
│   └── hf_english.py      # 영어 BART 요약
├── requirements.txt        # Python 의존성
├── run.py                 # 서버 실행 스크립트
└── README.md              # 이 파일
```

## 🔧 설정

### 환경 변수 (선택사항)
```bash
export CUDA_VISIBLE_DEVICES=0  # GPU 사용 시
```

### 모델 다운로드
첫 실행 시 필요한 모델들이 자동으로 다운로드됩니다:
- Whisper base 모델
- KoBART 요약 모델
- BART 요약 모델

## 🐛 문제 해결

### 메모리 부족
- Whisper 모델 크기 조정: `main.py`에서 `"base"` → `"small"`
- GPU 메모리 확인: `nvidia-smi`

### 모델 다운로드 실패
- 인터넷 연결 확인
- Hugging Face 토큰 설정 (선택사항)

## 📚 API 문서

서버 실행 후 다음 주소에서 자동 생성된 API 문서를 확인할 수 있습니다:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc 