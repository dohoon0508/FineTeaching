import React, { useState } from 'react';

interface Question {
  id: number;
  type: 'multiple' | 'subjective';
  question: string;
  options?: string[];
  correctAnswer: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

const sampleQuestions: Question[] = [
  {
    id: 1,
    type: 'multiple',
    question: 'React에서 상태를 관리하는 Hook은 무엇인가요?',
    options: ['useState', 'useEffect', 'useContext', 'useReducer'],
    correctAnswer: 'useState',
    difficulty: 'easy'
  },
  {
    id: 2,
    type: 'subjective',
    question: 'React의 주요 특징 중 하나를 설명해주세요.',
    correctAnswer: '컴포넌트 기반',
    difficulty: 'medium'
  },
  {
    id: 3,
    type: 'multiple',
    question: 'JSX에서 조건부 렌더링을 할 때 사용하는 방법은?',
    options: ['if문', '삼항 연산자', 'switch문', 'for문'],
    correctAnswer: '삼항 연산자',
    difficulty: 'easy'
  },
  {
    id: 4,
    type: 'subjective',
    question: 'Props와 State의 차이점을 설명해주세요.',
    correctAnswer: 'Props는 읽기 전용, State는 변경 가능',
    difficulty: 'hard'
  },
  {
    id: 5,
    type: 'multiple',
    question: 'React에서 리스트를 렌더링할 때 필요한 prop은?',
    options: ['id', 'key', 'name', 'value'],
    correctAnswer: 'key',
    difficulty: 'medium'
  }
];

function App() {
  const [currentStep, setCurrentStep] = useState<'intro' | 'quiz'>('intro');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<'ko' | 'en'>('ko');
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [showResults, setShowResults] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'multiple' | 'subjective'>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [showIncorrectOnly, setShowIncorrectOnly] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setTranscript('');
      setSummary('');
    }
  };

  const handleProcessAudio = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('lang', selectedLanguage);

      const response = await fetch('http://localhost:8000/upload-audio/', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setTranscript(data.transcript);
        setSummary(data.summary);
      } else {
        console.error('Audio processing failed');
      }
    } catch (error) {
      console.error('Error processing audio:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartQuiz = () => {
    setCurrentStep('quiz');
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setShowResults(false);
  };

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer) {
      setUserAnswers(prev => ({
        ...prev,
        [sampleQuestions[currentQuestionIndex].id]: selectedAnswer
      }));
      
      if (currentQuestionIndex < sampleQuestions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswer('');
      } else {
        setShowResults(true);
      }
    }
  };

  const goHome = () => {
    setCurrentStep('intro');
    setSelectedFile(null);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setShowResults(false);
    setSelectedAnswer('');
  };

  const goBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedAnswer(userAnswers[sampleQuestions[currentQuestionIndex - 1].id] || '');
    }
  };

  const filteredQuestions = sampleQuestions.filter(q => {
    if (filterType !== 'all' && q.type !== filterType) return false;
    if (filterDifficulty !== 'all' && q.difficulty !== filterDifficulty) return false;
    if (showIncorrectOnly) {
      const userAnswer = userAnswers[q.id];
      return userAnswer && userAnswer !== q.correctAnswer;
    }
    return true;
  });

  const currentQuestion = filteredQuestions[currentQuestionIndex] || sampleQuestions[0];

  if (currentStep === 'intro') {
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
                🎯 <span className="font-semibold text-purple-600">강의 음성</span>을 자동으로 요약하고 
                <span className="font-semibold text-blue-600"> 문제를 생성</span>해주는 
                <span className="font-semibold text-pink-600"> 학습 보조 웹앱</span>
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
                        <span className="text-lg font-semibold text-gray-800">자동 요약 및 문제 생성</span>
                        <p className="text-gray-600 text-sm mt-1">AI가 자동으로 요약하고 문제를 만들어줘</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 group">
                      <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-2xl flex items-center justify-center text-xl font-bold shadow-lg group-hover:scale-110 transition-transform">3</div>
                      <div className="flex-1">
                        <span className="text-lg font-semibold text-gray-800">문제 풀이 및 학습</span>
                        <p className="text-gray-600 text-sm mt-1">생성된 문제로 효과적인 학습 진행</p>
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
                    
                    {!transcript && !summary && (
                      <button
                        onClick={handleProcessAudio}
                        disabled={isProcessing}
                        className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        {isProcessing ? '🔄 처리 중...' : '🎤 음성 처리하기'}
                      </button>
                    )}

                    {transcript && summary && (
                      <div className="space-y-4">
                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-4 border border-blue-200">
                          <h4 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
                            📝 원문
                          </h4>
                          <p className="text-sm text-blue-700 leading-relaxed">{transcript}</p>
                        </div>
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200">
                          <h4 className="text-sm font-bold text-green-800 mb-2 flex items-center gap-2">
                            📋 요약
                          </h4>
                          <p className="text-sm text-green-700 leading-relaxed">{summary}</p>
                        </div>
                        <div className="flex gap-3">
                          <button className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
                            📄 요약 다운로드
                          </button>
                          <button
                            onClick={handleStartQuiz}
                            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                          >
                            🎯 문제 풀기
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'quiz') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-4 relative overflow-hidden">
        {/* 배경 장식 */}
        <div className="absolute top-10 right-10 w-20 h-20 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full opacity-30 animate-pulse"></div>
        <div className="absolute bottom-10 left-10 w-16 h-16 bg-gradient-to-br from-blue-200 to-cyan-200 rounded-full opacity-40 animate-bounce"></div>
        
        <div className="relative z-10 max-w-5xl mx-auto">
          {/* 네비게이션 */}
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
                {currentQuestionIndex + 1} / {filteredQuestions.length}
              </p>
            </div>
            <button
              onClick={goBack}
              disabled={currentQuestionIndex === 0}
              className="bg-white/80 backdrop-blur-sm hover:bg-white text-gray-700 font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              ⬅️ 뒤로 가기
            </button>
          </div>

          {/* 필터 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-2xl border border-white/20">
            <div className="flex flex-wrap gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">📝 문제 유형</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="border border-gray-300 rounded-xl px-4 py-2 text-sm bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">전체</option>
                  <option value="multiple">객관식</option>
                  <option value="subjective">주관식</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">🎚️ 난이도</label>
                <select
                  value={filterDifficulty}
                  onChange={(e) => setFilterDifficulty(e.target.value as any)}
                  className="border border-gray-300 rounded-xl px-4 py-2 text-sm bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">전체</option>
                  <option value="easy">쉬움</option>
                  <option value="medium">보통</option>
                  <option value="hard">어려움</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={showIncorrectOnly}
                    onChange={(e) => setShowIncorrectOnly(e.target.checked)}
                    className="rounded-lg w-5 h-5 text-purple-500 focus:ring-purple-500"
                  />
                  <span className="text-sm font-semibold text-gray-700">❌ 틀린 문제만 보기</span>
                </label>
              </div>
            </div>
          </div>

          {/* 문제 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/20">
            <div className="mb-6">
              <span className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold px-4 py-2 rounded-full mb-4 shadow-lg">
                {currentQuestion.type === 'multiple' ? '📋 객관식' : '✍️ 주관식'} • {currentQuestion.difficulty}
              </span>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-8 leading-relaxed">
              {currentQuestion.question}
            </h2>

            {currentQuestion.type === 'multiple' ? (
              <div className="space-y-4 mb-8">
                {currentQuestion.options?.map((option, index) => (
                  <label
                    key={index}
                    className={`block p-5 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                      selectedAnswer === option
                        ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 shadow-lg'
                        : 'border-gray-200 hover:border-purple-300 bg-white/50 backdrop-blur-sm'
                    }`}
                  >
                    <input
                      type="radio"
                      name="answer"
                      value={option}
                      checked={selectedAnswer === option}
                      onChange={(e) => handleAnswerSelect(e.target.value)}
                      className="sr-only"
                    />
                    <span className="text-gray-800 text-lg font-medium">{option}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="mb-8">
                <textarea
                  value={selectedAnswer}
                  onChange={(e) => handleAnswerSelect(e.target.value)}
                  placeholder="답을 입력해주세요..."
                  className="w-full p-5 border-2 border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg bg-white/50 backdrop-blur-sm"
                  rows={4}
                />
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleNextQuestion}
                disabled={!selectedAnswer}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {currentQuestionIndex === filteredQuestions.length - 1 ? '🎉 결과 보기' : '➡️ 다음'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default App; 