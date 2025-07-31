# FineTeaching 🎯

강의 음성을 자동으로 요약하고 문제를 생성해주는 학습 보조 웹앱

## 🌟 주요 기능

- **🎤 음성 파일 업로드**: MP3, M4A, WAV 파일 지원
- **🌍 다국어 지원**: 한국어/영어 음성 인식 및 요약
- **🤖 AI 자동 처리**: Whisper STT + Hugging Face 요약
- **📝 실시간 결과**: 원문과 요약 동시 표시
- **🎯 문제 생성**: 요약 내용 기반 문제 풀이
- **💯 100% 무료**: 모든 기능 무료 사용

## 🚀 빠른 시작

### 1. 백엔드 서버 실행

```bash
cd backend
pip install -r requirements.txt
python run.py
```

서버가 http://localhost:8000 에서 실행됩니다.

### 2. 프론트엔드 실행

```bash
npm start
```

웹앱이 http://localhost:3000 에서 실행됩니다.

## 🛠️ 기술 스택

### Frontend
- **React 19** + **TypeScript**
- **Tailwind CSS** - 모던 UI 디자인
- **Pretendard Font** - 한국어 최적화 폰트

### Backend
- **FastAPI** - 비동기 웹 프레임워크
- **Whisper** - OpenAI 음성 인식
- **Transformers** - Hugging Face 요약 모델
- **KoBART** - 한국어 요약 모델
- **BART** - 영어 요약 모델

## 📁 프로젝트 구조

```
fineteaching/
├── frontend/                 # React 프론트엔드
│   ├── src/
│   │   ├── App.tsx          # 메인 컴포넌트
│   │   └── index.css        # Tailwind 스타일
│   ├── package.json
│   └── tailwind.config.js
├── backend/                  # FastAPI 백엔드
│   ├── main.py              # FastAPI 앱
│   ├── stt_async.py         # Whisper STT
│   ├── summary_async.py     # 요약 처리
│   ├── summarizers/         # 요약 모델들
│   └── requirements.txt
└── README.md
```

## 🎯 사용 방법

1. **언어 선택**: 한국어 또는 영어 선택
2. **파일 업로드**: 음성 파일 선택 (MP3, M4A, WAV)
3. **음성 처리**: "음성 처리하기" 버튼 클릭
4. **결과 확인**: 원문과 요약 내용 확인
5. **문제 풀기**: 생성된 문제로 학습 진행

## 🔧 개발 환경 설정

### Frontend 개발
```bash
cd frontend
npm install
npm start
```

### Backend 개발
```bash
cd backend
pip install -r requirements.txt
python run.py
```

## 📡 API 문서

백엔드 서버 실행 후 다음 주소에서 API 문서를 확인할 수 있습니다:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🎨 UI 특징

- **생동감 있는 디자인**: 그라데이션과 애니메이션
- **반응형 레이아웃**: 모든 디바이스 지원
- **직관적인 UX**: 단계별 진행 표시
- **접근성 고려**: 키보드 네비게이션 지원

## 🚀 배포

### Frontend 배포
```bash
npm run build
```

### Backend 배포
```bash
# Docker 사용 권장
docker build -t fineteaching-backend .
docker run -p 8000:8000 fineteaching-backend
```

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 🙏 감사의 말

- **OpenAI Whisper**: 음성 인식 기술
- **Hugging Face**: 요약 모델 제공
- **Tailwind CSS**: 아름다운 UI 프레임워크
- **React Team**: 훌륭한 프론트엔드 라이브러리

---

**FineTeaching** - 더 나은 학습을 위한 AI 도구 🎯✨
