import React, { useState } from 'react';

interface Question {
  id: number;
  question: string;
  options: { [key: string]: string };
  correct: string;
  explanation: string;
}

interface AnswerResult {
  is_correct: boolean;
  result_message: string;
  explanation: string;
  correct_answer: string;
}

function App() {
  const [currentStep, setCurrentStep] = useState<'intro' | 'processing' | 'results' | 'quiz' | 'quiz-results'>('intro');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<'ko' | 'en'>('ko');
  const [lectureTitle, setLectureTitle] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingMessage, setProcessingMessage] = useState('');
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [correctAnswers, setCorrectAnswers] = useState<{ [key: number]: boolean }>({});
  const [score, setScore] = useState(0);
  const [isGraded, setIsGraded] = useState(false);

  // 멀티파일 업로드 핸들러
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFiles(Array.from(files));
      setTranscript('');
      setSummary('');
    }
  };

  // 멀티모달 파일 처리 (음성/PDF/PPT + 요약)
  const handleProcessFiles = async () => {
    if (selectedFiles.length === 0 || !lectureTitle) return;
    setCurrentStep('processing');
    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessingMessage('파일 업로드 중...');
    setTranscript('');
    setSummary('');

    // 진행률 시뮬레이션
    const progressInterval = setInterval(() => {
      setProcessingProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 10;
      });
    }, 800);

    try {
      // 1. 멀티모달 파일 업로드 및 텍스트 추출
      setProcessingMessage('파일 처리 중...');
      const uploadForm = new FormData();
      selectedFiles.forEach(file => {
        uploadForm.append('files', file);
      });
      uploadForm.append('ui_lang', selectedLanguage);
      uploadForm.append('lecture_title', lectureTitle);
      
      const uploadRes = await fetch('http://localhost:8000/multimodal-upload', {
        method: 'POST',
        body: uploadForm,
      });
      if (!uploadRes.ok) throw new Error('파일 처리 실패');
      const uploadData = await uploadRes.json();
      setTranscript(uploadData.combined_text);

      // 2. 요약
      setProcessingMessage('요약 생성 중...');
      const sumForm = new FormData();
      sumForm.append('text', uploadData.combined_text);
      sumForm.append('target_lang', selectedLanguage);
      sumForm.append('lecture_title', lectureTitle);
      const sumRes = await fetch('http://localhost:8000/summarize', {
        method: 'POST',
        body: sumForm,
      });
      if (!sumRes.ok) throw new Error('요약 실패');
      const sumData = await sumRes.json();
      setSummary(sumData.summary);

      setProcessingProgress(100);
      setProcessingMessage('처리 완료!');
      clearInterval(progressInterval);
      setTimeout(() => {
        setCurrentStep('results');
        setIsProcessing(false);
      }, 1000);
    } catch (error) {
      console.error('처리 오류:', error);
      setProcessingMessage(`처리 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      setIsProcessing(false);
      clearInterval(progressInterval);
      alert('파일 처리 중 오류가 발생했습니다. 콘솔을 확인해주세요.');
      setTimeout(() => {
        setCurrentStep('intro');
      }, 2000);
    }
  };

  // 문제 생성
  const handleStartQuiz = async () => {
    setCurrentStep('processing');
    setProcessingMessage('문제 생성 중...');
    setIsProcessing(true);
    setQuestions([]);
    setUserAnswers({});
    setCorrectAnswers({});
    setScore(0);
    setIsGraded(false);
    
    try {
      const quizForm = new FormData();
      quizForm.append('text', summary);
      quizForm.append('target_lang', selectedLanguage);
      quizForm.append('lecture_title', lectureTitle);
      const quizRes = await fetch('http://localhost:8000/quiz', {
        method: 'POST',
        body: quizForm,
      });
      if (!quizRes.ok) throw new Error('문제 생성 실패');
      const quizData = await quizRes.json();
      setQuestions(quizData.questions || []);
      setCurrentStep('quiz');
      setIsProcessing(false);
    } catch (error) {
      setProcessingMessage('문제 생성 실패');
      setIsProcessing(false);
      setCurrentStep('results');
    }
  };

  // 답안 선택
  const handleAnswerSelect = (questionId: number, answer: string) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  // 채점하기
  const handleGradeQuiz = () => {
    let correctCount = 0;
    const newCorrectAnswers: { [key: number]: boolean } = {};
    
    questions.forEach(question => {
      const userAnswer = userAnswers[question.id];
      const isCorrect = userAnswer === question.correct;
      newCorrectAnswers[question.id] = isCorrect;
      if (isCorrect) correctCount++;
    });
    
    setCorrectAnswers(newCorrectAnswers);
    setScore(correctCount);
    setIsGraded(true);
    setCurrentStep('quiz-results');
  };

  // 틀린 문제만 다시 풀기
  const handleRetryWrongAnswers = () => {
    const wrongQuestions = questions.filter(q => !correctAnswers[q.id]);
    if (wrongQuestions.length === 0) return;
    
    setQuestions(wrongQuestions);
    setUserAnswers({});
    setCorrectAnswers({});
    setScore(0);
    setIsGraded(false);
    setCurrentStep('quiz');
  };

  // 5문제 더 풀기
  const handleMoreQuestions = async () => {
    setCurrentStep('processing');
    setProcessingMessage('새로운 문제 생성 중...');
    setIsProcessing(true);
    setQuestions([]);
    setUserAnswers({});
    setCorrectAnswers({});
    setScore(0);
    setIsGraded(false);
    
    try {
      const quizForm = new FormData();
      quizForm.append('text', summary);
      quizForm.append('target_lang', selectedLanguage);
      quizForm.append('lecture_title', lectureTitle);
      const quizRes = await fetch('http://localhost:8000/quiz', {
        method: 'POST',
        body: quizForm,
      });
      if (!quizRes.ok) throw new Error('문제 생성 실패');
      const quizData = await quizRes.json();
      setQuestions(quizData.questions || []);
      setCurrentStep('quiz');
      setIsProcessing(false);
    } catch (error) {
      setProcessingMessage('문제 생성 실패');
      setIsProcessing(false);
      setCurrentStep('results');
    }
  };

  // 새로운 녹음 파일로 공부하기
  const handleNewRecording = () => {
    goHome();
  };

  // 다운로드 함수들 (TXT만)
  const downloadOriginalTxt = () => {
    const content = `과목명: ${lectureTitle}\n\n${transcript}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `원본_${lectureTitle || '강의'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  const downloadSummaryTxt = () => {
    const content = `과목명: ${lectureTitle}\n\n${summary}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `요약_${lectureTitle || '강의'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 메인으로 돌아가기
  const goHome = () => {
    setCurrentStep('intro');
    setSelectedFiles([]);
    setTranscript('');
    setSummary('');
    setLectureTitle('');
    setQuestions([]);
    setUserAnswers({});
    setCorrectAnswers({});
    setScore(0);
    setIsGraded(false);
    setProcessingProgress(0);
    setProcessingMessage('');
    setIsProcessing(false);
  };

  // --- UI 렌더링 ---
  if (currentStep === 'processing') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg p-8 shadow-sm border text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">처리 중...</h2>
          <p className="text-gray-600 mb-6">{processingMessage}</p>
          {/* 진행률 바 */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${processingProgress}%` }}
            ></div>
          </div>
          <p className="text-sm font-medium text-blue-600">{Math.round(processingProgress)}%</p>
        </div>
      </div>
    );
  }

  if (currentStep === 'quiz') {
    if (questions.length === 0) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">문제를 불러오는 중...</h2>
            <button onClick={goHome} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors">메인으로</button>
          </div>
        </div>
      );
    }

    const answeredCount = Object.keys(userAnswers).length;
    const canGrade = answeredCount === questions.length;

    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* 헤더 */}
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={goHome}
              className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-md border transition-colors"
            >
              메인으로
            </button>
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-gray-900">문제 풀이</h1>
              <p className="text-sm text-gray-600 mt-1">
                {answeredCount} / {questions.length} 문제 답안 선택 완료
              </p>
            </div>
            <div></div>
          </div>

          {/* 문제 목록 */}
          <div className="bg-white rounded-lg p-6 shadow-sm border mb-8 max-h-[70vh] overflow-y-auto">
            <div className="space-y-8">
              {questions.map((question, index) => (
                <div key={question.id} className="border-b border-gray-200 pb-8 last:border-b-0">
                  <div className="mb-4">
                    <span className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-md">
                      {index + 1}번 문제
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-medium text-gray-900 mb-4 leading-relaxed">
                    {question.question}
                  </h3>

                  {/* 보기 */}
                  <div className="space-y-2">
                    {Object.entries(question.options).map(([key, value]) => (
                      <label
                        key={key}
                        className={`block p-3 border rounded-md cursor-pointer transition-colors ${
                          userAnswers[question.id] === key
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          value={key}
                          checked={userAnswers[question.id] === key}
                          onChange={(e) => handleAnswerSelect(question.id, e.target.value)}
                          className="sr-only"
                        />
                        <span className="text-gray-900 font-medium">{key}. {value}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 채점하기 버튼 */}
          <div className="text-center">
            <button
              onClick={handleGradeQuiz}
              disabled={!canGrade}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-md transition-colors disabled:cursor-not-allowed"
            >
              {canGrade ? '채점하기' : `${answeredCount}/${questions.length} 문제 답안 선택 필요`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'quiz-results') {
    const wrongAnswersCount = Object.values(correctAnswers).filter(correct => !correct).length;

    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* 헤더 */}
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={goHome}
              className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-md border transition-colors"
            >
              메인으로
            </button>
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-gray-900">채점 결과</h1>
              <p className="text-lg font-medium text-blue-600 mt-1">
                점수: {score}/{questions.length} ({Math.round((score/questions.length)*100)}%)
              </p>
            </div>
            <div></div>
          </div>

          {/* 문제 결과 목록 */}
          <div className="bg-white rounded-lg p-6 shadow-sm border mb-8 max-h-[60vh] overflow-y-auto">
            <div className="space-y-8">
              {questions.map((question, index) => {
                const userAnswer = userAnswers[question.id];
                const isCorrect = correctAnswers[question.id];
                
                return (
                  <div key={question.id} className="border-b border-gray-200 pb-8 last:border-b-0">
                    <div className="mb-4 flex items-center gap-3">
                      <span className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-md">
                        {index + 1}번 문제
                      </span>
                      {isCorrect ? (
                        <span className="inline-block bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-md">
                          정답
                        </span>
                      ) : (
                        <span className="inline-block bg-red-100 text-red-800 text-sm font-medium px-3 py-1 rounded-md">
                          오답
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-medium text-gray-900 mb-4 leading-relaxed">
                      {question.question}
                    </h3>

                    {/* 보기 */}
                    <div className="space-y-2 mb-4">
                      {Object.entries(question.options).map(([key, value]) => {
                        let bgColor = 'bg-white';
                        let borderColor = 'border-gray-200';
                        
                        if (key === question.correct) {
                          bgColor = 'bg-green-50';
                          borderColor = 'border-green-500';
                        } else if (key === userAnswer && !isCorrect) {
                          bgColor = 'bg-red-50';
                          borderColor = 'border-red-500';
                        }
                        
                        return (
                          <div
                            key={key}
                            className={`p-3 border rounded-md ${bgColor} ${borderColor}`}
                          >
                            <span className="text-gray-900 font-medium">
                              {key}. {value}
                              {key === question.correct && ' (정답)'}
                              {key === userAnswer && !isCorrect && ' (선택한 답)'}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* 해설 */}
                    <div className="bg-blue-50 rounded-md p-4">
                      <h4 className="font-medium text-blue-900 mb-2">해설</h4>
                      <p className="text-blue-800 leading-relaxed">{question.explanation}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 하단 메뉴 */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">학습 메뉴</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {wrongAnswersCount > 0 && (
                <button
                  onClick={handleRetryWrongAnswers}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-4 rounded-md transition-colors"
                >
                  틀린문제 다시풀기 ({wrongAnswersCount}개)
                </button>
              )}
              <button
                onClick={handleMoreQuestions}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-md transition-colors"
              >
                5문제 더 풀기
              </button>
              <button
                onClick={handleNewRecording}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition-colors"
              >
                새로운 파일로 공부하기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'results') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* 헤더 */}
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={goHome}
              className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-md border transition-colors"
            >
              메인으로
            </button>
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-gray-900">처리 결과</h1>
              <p className="text-sm text-gray-600 mt-1">파일 처리 완료</p>
            </div>
            <button
              onClick={handleStartQuiz}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              문제 풀기
            </button>
          </div>
          {/* 결과 내용 */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* 원문 */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                원문
              </h3>
              <div className="bg-gray-50 rounded-md p-4 max-h-96 overflow-y-auto">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{transcript}</p>
              </div>
              <div className="mt-4">
                <button onClick={downloadOriginalTxt} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors">TXT 다운로드</button>
              </div>
            </div>
            {/* 요약 */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                요약
              </h3>
              <div className="bg-green-50 rounded-md p-4 max-h-96 overflow-y-auto">
                <p className="text-green-800 leading-relaxed whitespace-pre-wrap">{summary}</p>
              </div>
              <div className="mt-4">
                <button onClick={downloadSummaryTxt} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors">TXT 다운로드</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 인트로(메인) 화면
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          {/* 헤더 */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">FineTeaching</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              강의 음성, PDF, PPT를 자동으로 요약하고 문제를 생성해주는 학습 보조 도구
            </p>
          </div>
          {/* 메인 콘텐츠 */}
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* 왼쪽: 소개 */}
            <div className="space-y-8">
              {/* 3단계 카드 */}
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  간단한 3단계
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">1</div>
                    <div className="flex-1">
                      <span className="text-base font-medium text-gray-900">파일 업로드</span>
                      <p className="text-gray-600 text-sm mt-1">음성, PDF, PPT 파일을 업로드</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">2</div>
                    <div className="flex-1">
                      <span className="text-base font-medium text-gray-900">자동 요약</span>
                      <p className="text-gray-600 text-sm mt-1">AI가 자동으로 요약 생성</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">3</div>
                    <div className="flex-1">
                      <span className="text-base font-medium text-gray-900">결과 확인</span>
                      <p className="text-gray-600 text-sm mt-1">텍스트와 요약 결과 확인</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* 특징 뱃지들 */}
              <div className="flex flex-wrap gap-3">
                <div className="bg-green-100 text-green-800 px-4 py-2 rounded-md text-sm font-medium">
                  무료
                </div>
                <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-md text-sm font-medium">
                  자동 처리
                </div>
                <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-md text-sm font-medium">
                  즉시 결과
                </div>
              </div>
            </div>
            {/* 오른쪽: 업로드 */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">파일 업로드</h3>
                <p className="text-gray-600 mb-6">음성(MP3, M4A, WAV), PDF, PPT 파일을 지원합니다</p>
                {/* Language Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">언어 선택</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedLanguage('ko')}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        selectedLanguage === 'ko'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      한국어
                    </button>
                    <button
                      onClick={() => setSelectedLanguage('en')}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        selectedLanguage === 'en'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      English
                    </button>
                  </div>
                </div>
                {/* 과목명 입력란 */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">과목명(강의명)</label>
                  <input
                    type="text"
                    value={lectureTitle}
                    onChange={e => setLectureTitle(e.target.value)}
                    placeholder="예: 운영체제, 영어회화, 현대물리학 등"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <label className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md cursor-pointer transition-colors">
                  파일 선택하기 (여러 파일 가능)
                  <input
                    type="file"
                    accept=".m4a,.mp3,.wav,.pdf,.pptx"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
              {selectedFiles.length > 0 && (
                <div className="mt-6 space-y-4">
                  <div className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="bg-green-50 rounded-md p-3 border border-green-200">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{file.name}</p>
                            <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleProcessFiles}
                    disabled={isProcessing || !lectureTitle}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-md transition-colors disabled:cursor-not-allowed"
                  >
                    {isProcessing ? '처리 중...' : '파일 처리하기'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App; 