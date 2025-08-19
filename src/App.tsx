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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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

  // 파일 업로드 핸들러
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setTranscript('');
      setSummary('');
    }
  };

  // 음성 처리 (STT + 요약)
  const handleProcessAudio = async () => {
    if (!selectedFile || !lectureTitle) return;
    setCurrentStep('processing');
    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessingMessage('음성 파일 업로드 중...');
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
      // 1. STT
      setProcessingMessage('음성 → 텍스트 변환 중...');
      const sttForm = new FormData();
      sttForm.append('file', selectedFile);
      sttForm.append('ui_lang', selectedLanguage);
      const sttRes = await fetch('http://localhost:8000/stt', {
        method: 'POST',
        body: sttForm,
      });
      if (!sttRes.ok) throw new Error('STT 실패');
      const sttData = await sttRes.json();
      setTranscript(sttData.transcript);

      // 2. 요약
      setProcessingMessage('요약 생성 중...');
      const sumForm = new FormData();
      sumForm.append('text', sttData.transcript);
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
      setProcessingMessage('처리 중 오류 발생');
      setIsProcessing(false);
      setCurrentStep('intro');
      clearInterval(progressInterval);
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
    setSelectedFile(null);
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center p-4 relative overflow-hidden">
        {/* 배경 장식 */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full opacity-30 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 bg-gradient-to-br from-blue-200 to-cyan-200 rounded-full opacity-40 animate-bounce"></div>
        <div className="relative z-10 max-w-md w-full bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl animate-pulse">
            <svg className="w-12 h-12 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">처리 중...</h2>
          <p className="text-gray-600 mb-6">{processingMessage}</p>
          {/* 진행률 바 */}
          <div className="w-full bg-gray-200 rounded-full h-4 mb-6 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-4 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${processingProgress}%` }}
            ></div>
          </div>
          <p className="text-lg font-semibold text-purple-600">{Math.round(processingProgress)}%</p>
          <div className="text-sm text-gray-500 mt-2 space-y-1">
            <p>🎤 음성 파일 분석 중...</p>
            <p>📝 텍스트 변환 중...</p>
            <p>📋 요약 생성 중...</p>
            <p>🎯 문제 생성 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'quiz') {
    if (questions.length === 0) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center p-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">문제를 불러오는 중...</h2>
            <button onClick={goHome} className="bg-purple-500 text-white px-6 py-2 rounded">메인으로</button>
          </div>
        </div>
      );
    }

    const answeredCount = Object.keys(userAnswers).length;
    const canGrade = answeredCount === questions.length;

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-4 relative overflow-hidden">
        {/* 배경 장식 */}
        <div className="absolute top-10 right-10 w-20 h-20 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full opacity-30 animate-pulse"></div>
        <div className="absolute bottom-10 left-10 w-16 h-16 bg-gradient-to-br from-blue-200 to-cyan-200 rounded-full opacity-40 animate-bounce"></div>
        <div className="relative z-10 max-w-4xl mx-auto">
          {/* 헤더 */}
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={goHome}
              className="bg-white/80 backdrop-blur-sm hover:bg-white text-gray-700 font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              🏠 메인으로
            </button>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-800">🎯 문제 풀이</h1>
              <p className="text-sm text-gray-600 mt-1">
                {answeredCount} / {questions.length} 문제 답안 선택 완료
              </p>
            </div>
            <div></div>
          </div>

          {/* 문제 목록 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/20 mb-8 max-h-[70vh] overflow-y-auto">
            <div className="space-y-8">
              {questions.map((question, index) => (
                <div key={question.id} className="border-b border-gray-200 pb-8 last:border-b-0">
                  <div className="mb-4">
                    <span className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold px-4 py-2 rounded-full mb-4 shadow-lg">
                      📋 객관식 • {index + 1}번 문제
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-800 mb-6 leading-relaxed">
                    {question.question}
                  </h3>

                  {/* 보기 */}
                  <div className="space-y-3">
                    {Object.entries(question.options).map(([key, value]) => (
                      <label
                        key={key}
                        className={`block p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                          userAnswers[question.id] === key
                            ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 shadow-lg'
                            : 'border-gray-200 hover:border-purple-300 bg-white/50 backdrop-blur-sm'
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
                        <span className="text-gray-800 text-lg font-medium">{key}. {value}</span>
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
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 disabled:cursor-not-allowed disabled:hover:scale-100 text-lg"
            >
              {canGrade ? '📊 채점하기' : `${answeredCount}/${questions.length} 문제 답안 선택 필요`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'quiz-results') {
    const wrongAnswersCount = Object.values(correctAnswers).filter(correct => !correct).length;

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-4 relative overflow-hidden">
        {/* 배경 장식 */}
        <div className="absolute top-10 right-10 w-20 h-20 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full opacity-30 animate-pulse"></div>
        <div className="absolute bottom-10 left-10 w-16 h-16 bg-gradient-to-br from-blue-200 to-cyan-200 rounded-full opacity-40 animate-bounce"></div>
        <div className="relative z-10 max-w-4xl mx-auto">
          {/* 헤더 */}
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={goHome}
              className="bg-white/80 backdrop-blur-sm hover:bg-white text-gray-700 font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              🏠 메인으로
            </button>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-800">📊 채점 결과</h1>
              <p className="text-lg font-bold text-purple-600 mt-1">
                점수: {score}/{questions.length} ({Math.round((score/questions.length)*100)}%)
              </p>
            </div>
            <div></div>
          </div>

          {/* 문제 결과 목록 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/20 mb-8 max-h-[60vh] overflow-y-auto">
            <div className="space-y-8">
              {questions.map((question, index) => {
                const userAnswer = userAnswers[question.id];
                const isCorrect = correctAnswers[question.id];
                
                return (
                  <div key={question.id} className="border-b border-gray-200 pb-8 last:border-b-0">
                    <div className="mb-4 flex items-center gap-3">
                      <span className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg">
                        📋 {index + 1}번 문제
                      </span>
                      {isCorrect ? (
                        <span className="inline-block bg-green-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                          ✅ 정답
                        </span>
                      ) : (
                        <span className="inline-block bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                          ❌ 오답
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-800 mb-4 leading-relaxed">
                      {question.question}
                    </h3>

                    {/* 보기 */}
                    <div className="space-y-2 mb-4">
                      {Object.entries(question.options).map(([key, value]) => {
                        let bgColor = 'bg-white/50';
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
                            className={`p-3 border-2 rounded-lg ${bgColor} ${borderColor}`}
                          >
                            <span className="text-gray-800 font-medium">
                              {key}. {value}
                              {key === question.correct && ' (정답)'}
                              {key === userAnswer && !isCorrect && ' (선택한 답)'}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* 해설 */}
                    <div className="bg-blue-50 rounded-xl p-4">
                      <h4 className="font-bold text-blue-800 mb-2">💡 해설</h4>
                      <p className="text-blue-700 leading-relaxed">{question.explanation}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 하단 메뉴 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-white/20">
            <h3 className="text-lg font-bold text-gray-800 mb-4">📚 학습 메뉴</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {wrongAnswersCount > 0 && (
                <button
                  onClick={handleRetryWrongAnswers}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  ❌ 틀린문제 다시풀기 ({wrongAnswersCount}개)
                </button>
              )}
              <button
                onClick={handleMoreQuestions}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                🔄 5문제 더 풀기
              </button>
              <button
                onClick={handleNewRecording}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                🎤 새로운 녹음파일로 공부하기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'results') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-4 relative overflow-hidden">
        {/* 배경 장식 */}
        <div className="absolute top-10 right-10 w-20 h-20 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full opacity-30 animate-pulse"></div>
        <div className="absolute bottom-10 left-10 w-16 h-16 bg-gradient-to-br from-blue-200 to-cyan-200 rounded-full opacity-40 animate-bounce"></div>
        <div className="relative z-10 max-w-4xl mx-auto">
          {/* 헤더 */}
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={goHome}
              className="bg-white/80 backdrop-blur-sm hover:bg-white text-gray-700 font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              🏠 메인으로
            </button>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-800">📋 처리 결과</h1>
              <p className="text-sm text-gray-600 mt-1">음성 요약 완료</p>
            </div>
            <button
              onClick={handleStartQuiz}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              🎯 문제 풀기
            </button>
          </div>
          {/* 결과 내용 */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* 원문 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-white/20">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                📝 원문
              </h3>
              <div className="bg-gray-50 rounded-xl p-4 max-h-96 overflow-y-auto">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{transcript}</p>
              </div>
              <div className="mt-4">
                <button onClick={downloadOriginalTxt} className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-2 px-4 rounded-xl shadow hover:scale-105 transition">TXT 다운로드</button>
              </div>
            </div>
            {/* 요약 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-white/20">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                📋 요약
              </h3>
              <div className="bg-green-50 rounded-xl p-4 max-h-96 overflow-y-auto">
                <p className="text-green-700 leading-relaxed whitespace-pre-wrap">{summary}</p>
              </div>
              <div className="mt-4">
                <button onClick={downloadSummaryTxt} className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-2 px-4 rounded-xl shadow hover:scale-105 transition">TXT 다운로드</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 인트로(메인) 화면
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 relative overflow-hidden">
      {/* 배경 장식 요소들 */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full opacity-30 animate-pulse"></div>
      <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-blue-200 to-cyan-200 rounded-full opacity-40 animate-bounce"></div>
      <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-gradient-to-br from-green-200 to-emerald-200 rounded-full opacity-30 animate-ping"></div>
      <div className="absolute bottom-40 right-1/3 w-16 h-16 bg-gradient-to-br from-yellow-200 to-orange-200 rounded-full opacity-50 animate-spin"></div>
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-6xl w-full">
          {/* 헤더 */}
          <div className="text-center mb-12">
            <div className="inline-block p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mb-6 shadow-2xl">
              <h1 className="text-5xl font-bold text-white tracking-tight">FineTeaching</h1>
            </div>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed">
              🎯 <span className="font-semibold text-purple-600">강의 음성</span>을 자동으로 요약해주는 <span className="font-semibold text-pink-600">학습 보조 웹앱</span>
            </p>
          </div>
          {/* 메인 콘텐츠 */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* 왼쪽: 소개 */}
            <div className="space-y-8">
              {/* 3단계 카드 */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                  <span className="text-3xl">🚀</span>
                  간단한 3단계
                </h2>
                <div className="space-y-6">
                  <div className="flex items-center gap-6 group">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-2xl flex items-center justify-center text-xl font-bold shadow-lg group-hover:scale-110 transition-transform">1</div>
                    <div className="flex-1">
                      <span className="text-lg font-semibold text-gray-800">음성 파일 업로드</span>
                      <p className="text-gray-600 text-sm mt-1">MP3, M4A, WAV 파일을 간편하게 업로드</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 group">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-2xl flex items-center justify-center text-xl font-bold shadow-lg group-hover:scale-110 transition-transform">2</div>
                    <div className="flex-1">
                      <span className="text-lg font-semibold text-gray-800">자동 요약</span>
                      <p className="text-gray-600 text-sm mt-1">AI가 자동으로 요약해줘</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 group">
                    <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-2xl flex items-center justify-center text-xl font-bold shadow-lg group-hover:scale-110 transition-transform">3</div>
                    <div className="flex-1">
                      <span className="text-lg font-semibold text-gray-800">결과 확인</span>
                      <p className="text-gray-600 text-sm mt-1">텍스트와 요약 결과를 바로 확인</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* 특징 뱃지들 */}
              <div className="flex flex-wrap gap-4">
                <div className="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-shadow">
                  💯 100% 무료
                </div>
                <div className="bg-gradient-to-r from-blue-400 to-cyan-500 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-shadow">
                  ⚡ 자동 처리
                </div>
                <div className="bg-gradient-to-r from-purple-400 to-pink-500 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-shadow">
                  🎯 즉시 결과
                </div>
              </div>
            </div>
            {/* 오른쪽: 업로드 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl hover:scale-110 transition-transform">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">음성 파일 업로드</h3>
                <p className="text-gray-600 mb-6">MP3, M4A, WAV 파일을 지원합니다</p>
                {/* Language Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-700 mb-3">🌍 언어 선택</label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedLanguage('ko')}
                      className={`flex-1 py-3 px-6 rounded-xl text-sm font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 ${
                        selectedLanguage === 'ko'
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      🇰🇷 한국어
                    </button>
                    <button
                      onClick={() => setSelectedLanguage('en')}
                      className={`flex-1 py-3 px-6 rounded-xl text-sm font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 ${
                        selectedLanguage === 'en'
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      🇺🇸 English
                    </button>
                  </div>
                </div>
                {/* 과목명 입력란 */}
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-700 mb-2">📚 과목명(강의명)</label>
                  <input
                    type="text"
                    value={lectureTitle}
                    onChange={e => setLectureTitle(e.target.value)}
                    placeholder="예: 운영체제, 영어회화, 현대물리학 등"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <label className="block w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 px-8 rounded-2xl cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
                  📁 파일 선택하기
                  <input
                    type="file"
                    accept=".m4a,.mp3,.wav"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
              {selectedFile && (
                <div className="mt-6 space-y-4 animate-fadein">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{selectedFile.name}</p>
                        <p className="text-sm text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleProcessAudio}
                    disabled={isProcessing || !lectureTitle}
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {isProcessing ? '🔄 처리 중...' : '🎤 음성 처리하기'}
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