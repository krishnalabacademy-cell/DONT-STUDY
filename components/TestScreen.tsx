import React, { useState, useEffect, useMemo } from 'react';
import { Subject, Question, TestResult, IncorrectAnswerRecord } from '../types';
import { SUBJECTS, TEST_QUESTIONS } from '../constants';
import { TestIcon, AcademicCapIcon, SparklesIcon } from './Icon';
import { useLocalStorage } from '../hooks/useLocalStorage';


type TestState = 'selecting' | 'testing' | 'results';

const TestScreen: React.FC = () => {
  const [state, setState] = useState<TestState>('selecting');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [incorrectAnswers, setIncorrectAnswers] = useLocalStorage<IncorrectAnswerRecord>('incorrect-answers', {});

  const startTest = (subject: Subject) => {
    setSelectedSubject(subject);
    const allQuestions = TEST_QUESTIONS[subject];

    // Shuffle the array and pick the first 10 questions
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    setQuestions(shuffled.slice(0, 10));

    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setResults([]);
    setState('testing');
  };

  const handleAnswer = (answer: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setUserAnswers(newAnswers);

    setTimeout(() => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            // End of test
            calculateResults(newAnswers);
            setState('results');
        }
    }, 300); // Short delay for visual feedback
  };
  
  const calculateResults = (finalAnswers: string[]) => {
      const testResults = questions.map((q, index) => {
          const isCorrect = q.correctAnswer === finalAnswers[index];
          if (!isCorrect) {
              const newIncorrectRecord = {...incorrectAnswers};
              newIncorrectRecord[q.question] = (newIncorrectRecord[q.question] || 0) + 1;
              setIncorrectAnswers(newIncorrectRecord);
          }
          return {
              question: q.question,
              userAnswer: finalAnswers[index],
              correctAnswer: q.correctAnswer,
              isCorrect,
              year: q.year,
          };
      });
      setResults(testResults);
  };
  
  const score = useMemo(() => results.filter(r => r.isCorrect).length, [results]);

  const resetTest = () => {
    setState('selecting');
    setSelectedSubject(null);
  };

  if (state === 'selecting') {
    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold text-center mb-6 text-indigo-300">Select a Subject to Test</h2>
        <div className="grid grid-cols-2 gap-4">
          {SUBJECTS.map(subject => (
            <button key={subject} onClick={() => startTest(subject)} className="p-6 bg-gray-700 rounded-lg text-lg font-semibold hover:bg-indigo-600 transition-colors shadow-md hover:shadow-indigo-500/30">
              {subject}
            </button>
          ))}
        </div>
      </div>
    );
  }
  
  if (state === 'results') {
    const scorePercentage = (score / questions.length) * 100;
    const resultMessage = scorePercentage >= 80 ? "Excellent Work! 🔥" : scorePercentage >= 50 ? "Good Effort, Keep Practicing." : "Needs More Improvement. Don't Give Up!";

    return (
        <div className="p-4">
            <div className="text-center mb-6 p-6 bg-gray-900 rounded-lg">
                <h2 className="text-3xl font-bold text-indigo-400">Test Complete!</h2>
                <p className="text-5xl font-bold my-4">{score} / {questions.length}</p>
                <p className="text-gray-400">{resultMessage}</p>
            </div>
            <div className="space-y-3">
                {results.map((result, index) => (
                    <div key={index} className={`p-3 rounded-lg ${result.isCorrect ? 'bg-green-800/50' : 'bg-red-800/50'}`}>
                        <p className="font-semibold">{index + 1}. {result.question}</p>
                        {result.year && <p className="text-xs text-gray-400 font-mono mt-1">{result.year}</p>}
                        <p className={`text-sm mt-2 ${result.isCorrect ? 'text-green-300' : 'text-red-300'}`}>Your answer: {result.userAnswer}</p>
                        {!result.isCorrect && <p className="text-sm text-yellow-300">Correct answer: {result.correctAnswer}</p>}
                    </div>
                ))}
            </div>
            <button onClick={resetTest} className="w-full mt-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-500">
                Take Another Test
            </button>
        </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion) {
      // Handles the case where questions are not yet loaded
      return <div className="p-4 text-center">Loading test...</div>;
  }

  return (
    <div className="p-4 flex flex-col h-full">
        <div className="mb-4">
            <p className="text-sm text-gray-400 text-center">{selectedSubject} Test</p>
            <p className="text-lg font-semibold text-center">Question {currentQuestionIndex + 1} of {questions.length}</p>
            <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
                <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}></div>
            </div>
        </div>
        <div className="bg-gray-900 p-6 rounded-lg my-4 flex-grow flex flex-col justify-center">
            <h3 className="text-xl font-bold">{currentQuestion.question}</h3>
            {currentQuestion.year && <p className="text-xs text-gray-400 font-mono mt-2">{currentQuestion.year}</p>}
        </div>
        <div className="grid grid-cols-1 gap-3">
            {currentQuestion.options.map(option => (
                <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    className="w-full p-4 bg-gray-700 rounded-lg text-left font-medium hover:bg-indigo-600 transition-colors"
                >
                    {option}
                </button>
            ))}
        </div>
    </div>
  );
};

export default TestScreen;