import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Modal,
  ActivityIndicator, FlatList, Animated, Dimensions,
} from 'react-native';
// YoutubeIframe removed — using WebView-based player
import { WebView } from 'react-native-webview';
import { Colors } from '../../constants/Colors';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  CURRICULUM_15, PHASES, getWeek15States, overallProgress15, currentWeek15,
  type CurriculumWeek,
} from '../../tactics/curriculum15';
import {
  QUIZ_QUESTIONS, getQuestions, scoreQuiz, getIQLevel,
  type QuizQuestion, type QuizCategory, type QuizDifficulty,
} from '../../tactics/quizData';
import { TACTICS, type Tactic, type TacticCategory } from '../../tactics/data/tactics';
import TacticsAnimator from '../../components/TacticsAnimator';
import { getGames, type GameRecord } from '../../api/gamesService';
import { getFrameDetections } from '../../api/trackingService';
import { getNextMove, type NextMoveResponse } from '../../api/aiCoachService';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────────────────
type LearnTab = 'curriculum' | 'tactics' | 'quiz' | 'ai_coach';
type QuizState = 'config' | 'playing' | 'results';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const DIFF_COLOR: Record<string, string> = {
  beginner:     '#00CC66',
  intermediate: '#FFD700',
  advanced:     '#FF3B30',
};

const CATEGORY_LABELS: { key: TacticCategory | 'all'; label: string }[] = [
  { key: 'all',        label: 'All' },
  { key: 'breakout',   label: 'Breakout' },
  { key: 'forecheck',  label: 'Forecheck' },
  { key: 'powerplay',  label: 'Power Play' },
  { key: 'penaltykill',label: 'Penalty Kill' },
  { key: 'neutral',    label: 'Neutral Zone' },
];

const QUIZ_CAT_LABELS: { key: QuizCategory | 'all'; label: string }[] = [
  { key: 'all',        label: 'All' },
  { key: 'tactics',    label: 'Tactics' },
  { key: 'rules',      label: 'Rules' },
  { key: 'positioning',label: 'Positioning' },
  { key: 'game_sense', label: 'Game Sense' },
  { key: 'scouting',   label: 'Scouting' },
];

// ─── Sub-tab: Curriculum ─────────────────────────────────────────────────────
function CurriculumTab() {
  const { plan } = useSubscription();
  const [scores] = useState<Record<number, number>>({});
  const [expandedPhase, setExpandedPhase] = useState<number | null>(1);
  const [selectedWeek, setSelectedWeek] = useState<CurriculumWeek | null>(null);

  const planTier = (plan === 'team' ? 'pro' : plan) as 'free' | 'starter' | 'pro';
  const weekStates = getWeek15States(scores, planTier);
  const overallPct = overallProgress15(scores);
  const curWeek = currentWeek15(scores);

  return (
    <ScrollView style={styles.tabContent} contentContainerStyle={{ paddingBottom: 32 }}>
      {/* Overall progress */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>전체 진행률</Text>
          <Text style={styles.progressPct}>{overallPct}%</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${overallPct}%` }]} />
        </View>
        <Text style={styles.progressSub}>Current: Week {curWeek}</Text>
      </View>

      {/* Phase accordions */}
      {PHASES.map(phase => {
        const isExpanded = expandedPhase === phase.phase;
        const phaseWeeks = weekStates.filter(ws => ws.week.phase === phase.phase);
        const phaseDone = phaseWeeks.filter(ws => ws.completionPct >= 80).length;

        return (
          <View key={phase.phase} style={styles.phaseCard}>
            <Pressable
              style={styles.phaseHeader}
              onPress={() => setExpandedPhase(isExpanded ? null : phase.phase)}
            >
              <View style={{ flex: 1 }}>
                <View style={styles.phaseTopRow}>
                  <Text style={styles.phaseNum}>Phase {phase.phase}</Text>
                  <View style={[styles.diffBadge, { backgroundColor: DIFF_COLOR[phase.difficulty] + '22', borderColor: DIFF_COLOR[phase.difficulty] }]}>
                    <Text style={[styles.diffBadgeText, { color: DIFF_COLOR[phase.difficulty] }]}>
                      {phase.difficulty.charAt(0).toUpperCase() + phase.difficulty.slice(1)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.phaseTitle}>{phase.title}</Text>
                <Text style={styles.phaseSub}>{phase.description}</Text>
                <Text style={styles.phaseProgress}>{phaseDone}/{phaseWeeks.length} weeks done</Text>
              </View>
              <Text style={[styles.chevron, { transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }]}>›</Text>
            </Pressable>

            {isExpanded && (
              <View style={styles.weekList}>
                {phaseWeeks.map(({ week, locked, completionPct }) => (
                  <Pressable
                    key={week.weekNumber}
                    style={[styles.weekRow, locked && styles.weekRowLocked]}
                    onPress={() => !locked && setSelectedWeek(week)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.weekTitle, locked && { color: Colors.subtext }]}>
                        Week {week.weekNumber}: {week.title}
                      </Text>
                      <View style={styles.weekMeta}>
                        <Text style={[styles.weekMetaText, { color: DIFF_COLOR[week.difficulty] }]}>
                          {week.difficulty.charAt(0).toUpperCase() + week.difficulty.slice(1)}
                        </Text>
                        {completionPct > 0 && (
                          <Text style={styles.weekMetaText}> · {completionPct}% done</Text>
                        )}
                        {locked && week.planRequired !== 'free' && (
                          <Text style={[styles.weekMetaText, { color: Colors.accent }]}>
                            {' · '}{week.planRequired.toUpperCase()} plan
                          </Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.weekRight}>
                      {locked ? (
                        <Text style={styles.lockIcon}>🔒</Text>
                      ) : (
                        <>
                          {completionPct >= 80 && <Text style={styles.checkIcon}>✓</Text>}
                          <Text style={styles.chevron}>›</Text>
                        </>
                      )}
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        );
      })}

      {/* Week detail modal */}
      {selectedWeek && (
        <WeekDetailModal week={selectedWeek} onClose={() => setSelectedWeek(null)} />
      )}
    </ScrollView>
  );
}

// ─── Week Detail Modal ────────────────────────────────────────────────────────
function WeekDetailModal({ week, onClose }: { week: CurriculumWeek; onClose: () => void }) {
  const LESSON_ICONS: Record<string, string> = {
    theory:       '📖',
    animation:    '🎬',
    clip_analysis:'🎞',
    quiz:         '❓',
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>Week {week.weekNumber}: {week.title}</Text>
              <Text style={styles.modalSub}>{week.description}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
            {week.days.map(day => (
              <View key={day.dayNumber} style={styles.daySection}>
                <Text style={styles.dayTitle}>Day {day.dayNumber}</Text>
                {day.lessons.map((lesson, i) => (
                  <View key={i} style={styles.lessonRow}>
                    <Text style={styles.lessonIcon}>{LESSON_ICONS[lesson.type] ?? '📌'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.lessonTitle}>{lesson.title}</Text>
                      <Text style={styles.lessonMeta}>
                        {lesson.type.replace('_', ' ')} · {lesson.durationMin} min
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Sub-tab: Tactics ────────────────────────────────────────────────────────
function TacticsTab() {
  const { plan } = useSubscription();
  const isPro = plan === 'pro' || plan === 'team';
  const isStarter = isPro || plan === 'starter';
  const [selectedCategory, setSelectedCategory] = useState<TacticCategory | 'all'>('all');
  const [selectedTactic, setSelectedTactic] = useState<Tactic | null>(null);

  // Plan gates: free=3 tactics, starter/pro=all
  const FREE_TACTIC_IDS = ['basic_breakout', 'forecheck_122', 'pk_box'];

  const visibleTactics = TACTICS.filter(t => {
    const categoryMatch = selectedCategory === 'all' || t.category === selectedCategory;
    if (!isStarter) return categoryMatch && FREE_TACTIC_IDS.includes(t.id);
    return categoryMatch;
  });

  return (
    <View style={styles.tabContent}>
      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {CATEGORY_LABELS.map(({ key, label }) => (
          <Pressable
            key={key}
            style={[styles.filterChip, selectedCategory === key && styles.filterChipActive]}
            onPress={() => setSelectedCategory(key as TacticCategory | 'all')}
          >
            <Text style={[styles.filterChipText, selectedCategory === key && styles.filterChipTextActive]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Grid */}
      <ScrollView contentContainerStyle={styles.tacticGrid}>
        {visibleTactics.map(tactic => (
          <Pressable
            key={tactic.id}
            style={styles.tacticCard}
            onPress={() => setSelectedTactic(tactic)}
          >
            <View style={styles.tacticCardTop}>
              <View style={[styles.diffPill, { backgroundColor: DIFF_COLOR[tactic.difficulty] + '33' }]}>
                <Text style={[styles.diffPillText, { color: DIFF_COLOR[tactic.difficulty] }]}>
                  {tactic.difficulty.charAt(0).toUpperCase() + tactic.difficulty.slice(1)}
                </Text>
              </View>
            </View>
            <Text style={styles.tacticCardTitle}>{tactic.title}</Text>
            <View style={styles.tacticCardMeta}>
              <Text style={styles.tacticCardCategory}>{tactic.category.toUpperCase()}</Text>
              <Text style={styles.tacticCardSteps}>{tactic.steps.length} steps</Text>
            </View>
            <View style={styles.tacticPlayBtn}>
              <Text style={styles.tacticPlayText}>▶ Play</Text>
            </View>
          </Pressable>
        ))}
        {!isStarter && (
          <View style={styles.upgradeCard}>
            <Text style={styles.upgradeIcon}>🔒</Text>
            <Text style={styles.upgradeText}>Upgrade to Starter</Text>
            <Text style={styles.upgradeSub}>to unlock all {TACTICS.length} tactics</Text>
          </View>
        )}
      </ScrollView>

      {/* Fullscreen animator modal */}
      {selectedTactic && (
        <Modal visible animationType="slide" transparent={false} onRequestClose={() => setSelectedTactic(null)}>
          <View style={styles.animatorModal}>
            <View style={styles.animatorModalHeader}>
              <Pressable onPress={() => setSelectedTactic(null)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </Pressable>
              <Text style={styles.animatorModalTitle}>{selectedTactic.title}</Text>
              <View style={{ width: 36 }} />
            </View>
            <ScrollView>
              <TacticsAnimator tacticId={selectedTactic.id} autoPlay compact />
            </ScrollView>
          </View>
        </Modal>
      )}
    </View>
  );
}

// ─── Sub-tab: Quiz ────────────────────────────────────────────────────────────
function QuizTab() {
  const { plan } = useSubscription();
  const isFree = plan === 'free';

  const [quizState, setQuizState] = useState<QuizState>('config');
  const [category, setCategory] = useState<QuizCategory | 'all'>('all');
  const [difficulty, setDifficulty] = useState<QuizDifficulty | 'all'>('all');
  const [questionCount, setQuestionCount] = useState<5 | 10 | 20>(10);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [freeQUsed, setFreeQUsed] = useState(0);

  const FREE_DAILY_LIMIT = 3;

  const startQuiz = () => {
    const qs = getQuestions(
      category,
      difficulty,
      isFree ? Math.min(questionCount, FREE_DAILY_LIMIT - freeQUsed) as 5 | 10 | 20 : questionCount
    );
    if (qs.length === 0) return;
    setQuestions(qs);
    setAnswers(new Array(qs.length).fill(null));
    setCurrentQ(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setQuizState('playing');
  };

  const handleAnswer = (idx: number) => {
    if (showFeedback) return;
    setSelectedAnswer(idx);
    setShowFeedback(true);
    const newAnswers = [...answers];
    newAnswers[currentQ] = idx;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQ + 1 >= questions.length) {
      if (isFree) setFreeQUsed(p => p + questions.length);
      setQuizState('results');
    } else {
      setCurrentQ(i => i + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    }
  };

  if (quizState === 'playing' && questions.length > 0) {
    const q = questions[currentQ];
    return <QuizPlayer
      question={q}
      questionIndex={currentQ}
      totalQuestions={questions.length}
      selectedAnswer={selectedAnswer}
      showFeedback={showFeedback}
      onAnswer={handleAnswer}
      onNext={handleNext}
    />;
  }

  if (quizState === 'results') {
    const score = scoreQuiz(answers, questions);
    const iqLevel = getIQLevel(score);
    const wrong = questions.filter((_, i) => answers[i] !== null && answers[i] !== questions[i].correctIndex);
    return (
      <ScrollView style={styles.tabContent} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={styles.resultsCard}>
          <Text style={styles.resultsTitle}>Quiz Complete!</Text>
          <Text style={styles.resultsScore}>{score}</Text>
          <Text style={styles.resultsScoreLabel}>/ 100</Text>
          <View style={[styles.iqBadge, { borderColor: iqLevel.color }]}>
            <Text style={[styles.iqBadgeText, { color: iqLevel.color }]}>{iqLevel.label}</Text>
          </View>
          <Text style={styles.resultsDetail}>
            {answers.filter((a, i) => a === questions[i].correctIndex).length} / {questions.length} correct
          </Text>
        </View>

        {wrong.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Review Wrong Answers</Text>
            {wrong.map((q, i) => (
              <View key={q.id} style={styles.reviewCard}>
                <Text style={styles.reviewQ}>{q.question}</Text>
                <Text style={[styles.reviewAnswer, { color: '#FF3B30' }]}>
                  Your answer: {q.options[answers[questions.indexOf(q)] ?? 0]}
                </Text>
                <Text style={[styles.reviewAnswer, { color: '#00CC66' }]}>
                  Correct: {q.options[q.correctIndex]}
                </Text>
                <Text style={styles.reviewExplanation}>{q.explanation}</Text>
              </View>
            ))}
          </View>
        )}

        <Pressable style={styles.primaryBtn} onPress={() => setQuizState('config')}>
          <Text style={styles.primaryBtnText}>다시 풀기</Text>
        </Pressable>
      </ScrollView>
    );
  }

  // Config screen
  return (
    <ScrollView style={styles.tabContent} contentContainerStyle={{ paddingBottom: 32 }}>
      <Text style={styles.sectionTitle}>카테고리</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
        {QUIZ_CAT_LABELS.map(({ key, label }) => (
          <Pressable
            key={key}
            style={[styles.filterChip, category === key && styles.filterChipActive]}
            onPress={() => setCategory(key as QuizCategory | 'all')}
          >
            <Text style={[styles.filterChipText, category === key && styles.filterChipTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={styles.sectionTitle}>난이도</Text>
      <View style={styles.selectorRow}>
        {(['all', 'beginner', 'intermediate', 'advanced'] as const).map(d => (
          <Pressable
            key={d}
            style={[styles.selectorBtn, difficulty === d && styles.selectorBtnActive]}
            onPress={() => setDifficulty(d)}
          >
            <Text style={[styles.selectorBtnText, difficulty === d && styles.selectorBtnTextActive]}>
              {d === 'all' ? '전체' : d === 'beginner' ? '초급' : d === 'intermediate' ? '중급' : '고급'}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>문제 수</Text>
      <View style={styles.selectorRow}>
        {([5, 10, 20] as const).map(n => {
          const limitedN = isFree ? Math.min(n, FREE_DAILY_LIMIT - freeQUsed) : n;
          const disabled = isFree && freeQUsed >= FREE_DAILY_LIMIT;
          return (
            <Pressable
              key={n}
              style={[styles.selectorBtn, questionCount === n && styles.selectorBtnActive, disabled && styles.selectorBtnDisabled]}
              onPress={() => !disabled && setQuestionCount(n)}
            >
              <Text style={[styles.selectorBtnText, questionCount === n && styles.selectorBtnTextActive]}>
                {n}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isFree && (
        <View style={styles.freeNotice}>
          <Text style={styles.freeNoticeText}>
            Free: {Math.max(0, FREE_DAILY_LIMIT - freeQUsed)} questions remaining today
          </Text>
        </View>
      )}

      <Pressable
        style={[styles.primaryBtn, (isFree && freeQUsed >= FREE_DAILY_LIMIT) && styles.primaryBtnDisabled]}
        onPress={startQuiz}
        disabled={isFree && freeQUsed >= FREE_DAILY_LIMIT}
      >
        <Text style={styles.primaryBtnText}>퀴즈 시작</Text>
      </Pressable>
    </ScrollView>
  );
}

// ─── Quiz Player ──────────────────────────────────────────────────────────────
interface QuizPlayerProps {
  question: QuizQuestion;
  questionIndex: number;
  totalQuestions: number;
  selectedAnswer: number | null;
  showFeedback: boolean;
  onAnswer: (idx: number) => void;
  onNext: () => void;
}

function QuizPlayer({ question, questionIndex, totalQuestions, selectedAnswer, showFeedback, onAnswer, onNext }: QuizPlayerProps) {
  const isCorrect = selectedAnswer === question.correctIndex;
  const progress = ((questionIndex + 1) / totalQuestions) * 100;

  return (
    <ScrollView style={styles.tabContent} contentContainerStyle={{ paddingBottom: 32 }}>
      {/* Progress bar */}
      <View style={styles.quizProgressRow}>
        <Text style={styles.quizProgressLabel}>{questionIndex + 1} / {totalQuestions}</Text>
        <View style={styles.quizProgressBarBg}>
          <View style={[styles.quizProgressBarFill, { width: `${progress}%` }]} />
        </View>
      </View>

      {/* Category badge */}
      <View style={styles.quizMeta}>
        <View style={[styles.diffPill, { backgroundColor: DIFF_COLOR[question.difficulty] + '33' }]}>
          <Text style={[styles.diffPillText, { color: DIFF_COLOR[question.difficulty] }]}>
            {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
          </Text>
        </View>
        <Text style={styles.quizCategory}>{question.category.replace('_', ' ').toUpperCase()}</Text>
      </View>

      {/* Situation */}
      <View style={styles.situationBox}>
        <Text style={styles.situationLabel}>SITUATION</Text>
        <Text style={styles.situationText}>{question.situation}</Text>
      </View>

      {/* Question */}
      <Text style={styles.questionText}>{question.question}</Text>

      {/* Options */}
      {question.options.map((option, idx) => {
        let optStyle = styles.optionBtn;
        let optTextStyle = styles.optionBtnText;
        if (showFeedback) {
          if (idx === question.correctIndex) {
            optStyle = { ...styles.optionBtn, ...styles.optionCorrect } as any;
            optTextStyle = { ...styles.optionBtnText, color: '#00CC66' } as any;
          } else if (idx === selectedAnswer && idx !== question.correctIndex) {
            optStyle = { ...styles.optionBtn, ...styles.optionWrong } as any;
            optTextStyle = { ...styles.optionBtnText, color: '#FF3B30' } as any;
          }
        } else if (selectedAnswer === idx) {
          optStyle = { ...styles.optionBtn, ...styles.optionSelected } as any;
        }

        return (
          <Pressable key={idx} style={optStyle} onPress={() => onAnswer(idx)}>
            <Text style={styles.optionLetter}>{String.fromCharCode(65 + idx)}.</Text>
            <Text style={[optTextStyle, { flex: 1 }]}>{option}</Text>
          </Pressable>
        );
      })}

      {/* Feedback */}
      {showFeedback && (
        <View style={[styles.feedbackBox, { borderColor: isCorrect ? '#00CC66' : '#FF3B30' }]}>
          <Text style={[styles.feedbackTitle, { color: isCorrect ? '#00CC66' : '#FF3B30' }]}>
            {isCorrect ? '✓ 정답!' : '✗ 오답'}
          </Text>
          <Text style={styles.feedbackExplanation}>{question.explanation}</Text>
        </View>
      )}

      {showFeedback && (
        <Pressable style={styles.primaryBtn} onPress={onNext}>
          <Text style={styles.primaryBtnText}>
            {questionIndex + 1 >= totalQuestions ? '결과 보기' : '다음'}
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

// ─── Sub-tab: AI Coach ────────────────────────────────────────────────────────
function AICoachTab() {
  const { plan } = useSubscription();
  const { user } = useAuth();
  const isPro = plan === 'pro' || plan === 'team';

  const [games, setGames] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameRecord | null>(null);
  const [showCoach, setShowCoach] = useState(false);

  useEffect(() => {
    if (!isPro || !user?.uid) return;
    setLoading(true);
    getGames(user.uid)
      .then(setGames)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isPro, user?.uid]);

  if (!isPro) {
    return (
      <View style={styles.lockScreen}>
        <Text style={styles.lockIcon}>🔒</Text>
        <Text style={styles.lockTitle}>Pro 전용</Text>
        <Text style={styles.lockSub}>
          AI Coach analyzes your game footage and provides personalized tactical recommendations.{'\n\n'}
          Upgrade to Pro to unlock.
        </Text>
        <View style={styles.lockFeatureList}>
          {['Situational analysis per player', 'Recommended tactic adjustments', 'Weakness → lesson mapping', 'Full coaching report'].map(f => (
            <View key={f} style={styles.lockFeatureRow}>
              <Text style={styles.lockFeatureDot}>•</Text>
              <Text style={styles.lockFeatureText}>{f}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (showCoach && selectedGame) {
    return <AICoachPlayer game={selectedGame} onBack={() => setShowCoach(false)} />;
  }

  return (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>경기 선택</Text>
      {loading ? (
        <ActivityIndicator color={Colors.accent} style={{ marginTop: 32 }} />
      ) : games.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📹</Text>
          <Text style={styles.emptyText}>아직 분석된 경기가 없어요</Text>
          <Text style={styles.emptySub}>분석 탭에서 경기를 먼저 업로드하세요</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          {games.map(game => (
            <Pressable
              key={game.id}
              style={[styles.gameCard, selectedGame?.id === game.id && styles.gameCardSelected]}
              onPress={() => setSelectedGame(game)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.gameCardTitle}>{game.title}</Text>
                <Text style={styles.gameCardSub}>{game.videoStem}</Text>
                <View style={[styles.statusPill, { backgroundColor: game.status === 'done' ? '#00CC6633' : '#FFD70033' }]}>
                  <Text style={[styles.statusPillText, { color: game.status === 'done' ? '#00CC66' : '#FFD700' }]}>
                    {game.status}
                  </Text>
                </View>
              </View>
              {selectedGame?.id === game.id && (
                <Text style={{ color: Colors.accent, fontSize: 18 }}>✓</Text>
              )}
            </Pressable>
          ))}
        </ScrollView>
      )}

      {selectedGame && selectedGame.status === 'done' && (
        <Pressable style={[styles.primaryBtn, { margin: 16 }]} onPress={() => setShowCoach(true)}>
          <Text style={styles.primaryBtnText}>Start AI Coaching</Text>
        </Pressable>
      )}
    </View>
  );
}

// ─── AI Coach Player ──────────────────────────────────────────────────────────
function AICoachPlayer({ game, onBack }: { game: GameRecord; onBack: () => void }) {
  const [player, setPlayer] = useState(game.topPlayers?.[0] ?? '');
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<NextMoveResponse | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const playerRef = useRef<any>(null);

  const videoId = game.youtubeUrl
    ? game.youtubeUrl.replace(/.*(?:youtu\.be\/|v=)([^&]+).*/, '$1')
    : null;

  const handleAIPress = useCallback(async () => {
    if (analyzing) return;
    setVideoPlaying(false);
    setAnalyzing(true);
    setAnalysis(null);
    setShowOverlay(false);
    try {
      // Get current time → frame number (fps=4)
      const currentTime = await playerRef.current?.getCurrentTime() ?? 0;
      const frameNumber = Math.round(currentTime * 4);

      // Fetch player positions at this frame
      let detections: any[] = [];
      let targetBbox: number[] = [0, 0, 0, 0];
      try {
        const frameData = await getFrameDetections(game.videoStem, frameNumber);
        detections = frameData;
        const target = frameData.find(d => String(d.jersey ?? '').replace(/^0+/, '') === player.replace(/^0+/, ''));
        if (target) targetBbox = target.bbox;
      } catch (_) {}

      // POST to AI coach
      const result = await getNextMove(
        game.videoStem, player, frameNumber, detections, targetBbox, 'neutral', '5v5',
      );
      setAnalysis(result);
      setShowOverlay(true);
      fadeAnim.setValue(1);
    } catch (_) {
      // Fallback to mock
      setAnalysis({
        situation_analysis: 'Player positioned too deep in own zone during breakout, limiting passing options.',
        primary_recommendation: {
          action: 'Adjust positioning',
          description: 'Move 3-5 feet higher up the boards before receiving the puck to create a better outlet lane.',
          player_move: 'Skate from behind the net to the half-wall before the puck reaches the corner.',
        },
        alternative: 'If the lane is covered, use the reverse breakout to the opposite D.',
        danger_zones: ['Own blue line gap', 'Center lane exposure on slow breakouts'],
        related_tactic: 'basic_breakout',
      });
      setShowOverlay(true);
      fadeAnim.setValue(1);
    } finally {
      setAnalyzing(false);
    }
  }, [analyzing, player, game.videoStem, game.youtubeUrl, fadeAnim]);

  const handleContinue = useCallback(() => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 3000, useNativeDriver: true }).start(() => {
      setShowOverlay(false);
      setAnalysis(null);
      setVideoPlaying(true);
    });
  }, [fadeAnim]);

  return (
    <View style={styles.tabContent}>
      <Pressable onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backBtnText}>‹ Back to Games</Text>
      </Pressable>

      <Text style={styles.coachGameTitle}>{game.title}</Text>

      {/* Player selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, marginBottom: 12 }}>
        {(game.topPlayers ?? []).map(p => (
          <Pressable
            key={p}
            style={[styles.filterChip, player === p && styles.filterChipActive]}
            onPress={() => setPlayer(p)}
          >
            <Text style={[styles.filterChipText, player === p && styles.filterChipTextActive]}>#{p}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Video player area */}
      <View style={aiStyles.videoContainer}>
        {videoId ? (
          <WebView
            ref={playerRef}
            style={{ width: SCREEN_W, height: SCREEN_W * 0.56 }}
            source={{ uri: `https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1` }}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
          />
        ) : (
          <View style={aiStyles.noVideoPlaceholder}>
            <Text style={aiStyles.noVideoIcon}>📹</Text>
            <Text style={aiStyles.noVideoText}>No YouTube URL for this game</Text>
          </View>
        )}

        {/* Gold AI button */}
        <Pressable
          style={[aiStyles.aiBtn, analyzing && { opacity: 0.6 }]}
          onPress={handleAIPress}
          disabled={analyzing}
        >
          {analyzing
            ? <ActivityIndicator color="#000" size="small" />
            : <Text style={aiStyles.aiBtnText}>🤖 AI</Text>
          }
        </Pressable>
      </View>

      {/* Analysis overlay */}
      {showOverlay && analysis && (
        <Animated.View style={[aiStyles.analysisPanel, { opacity: fadeAnim }]}>
          <ScrollView contentContainerStyle={{ gap: 10 }}>
            <Text style={styles.aiSuggestionTitle}>AI Situation Analysis</Text>
            <Text style={styles.aiSuggestionText}>{analysis.situation_analysis}</Text>

            <View style={styles.divider} />
            <Text style={styles.aiLabel}>PRIMARY RECOMMENDATION</Text>
            <Text style={styles.aiActionText}>{analysis.primary_recommendation.action}</Text>
            <Text style={styles.aiSuggestionText}>{analysis.primary_recommendation.description}</Text>
            <Text style={[styles.aiSuggestionText, { color: Colors.accent, marginTop: 4 }]}>
              → {analysis.primary_recommendation.player_move}
            </Text>

            <View style={styles.divider} />
            <Text style={styles.aiLabel}>ALTERNATIVE</Text>
            <Text style={styles.aiSuggestionText}>{analysis.alternative}</Text>

            <View style={styles.divider} />
            <Text style={styles.aiLabel}>DANGER ZONES</Text>
            {analysis.danger_zones.map(dz => (
              <Text key={dz} style={[styles.aiSuggestionText, { color: '#FF3B30' }]}>⚠ {dz}</Text>
            ))}
          </ScrollView>

          <Pressable style={aiStyles.continueBtn} onPress={handleContinue}>
            <Text style={aiStyles.continueBtnText}>Continue ▶</Text>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

const aiStyles = StyleSheet.create({
  videoContainer: {
    width: SCREEN_W, alignSelf: 'center',
    backgroundColor: '#000', position: 'relative',
  },
  noVideoPlaceholder: {
    height: SCREEN_W * 0.56, backgroundColor: Colors.input,
    justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  noVideoIcon: { fontSize: 40 },
  noVideoText: { fontSize: 13, color: Colors.subtext },
  aiBtn: {
    position: 'absolute', bottom: 12, right: 12,
    backgroundColor: '#FFD700', borderRadius: 24,
    paddingHorizontal: 16, paddingVertical: 10,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4, shadowRadius: 4, elevation: 6,
  },
  aiBtnText: { fontSize: 14, fontWeight: '800', color: '#000' },
  analysisPanel: {
    backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.border,
    padding: 16, maxHeight: 340, gap: 8,
  },
  continueBtn: {
    marginTop: 8, height: 44, borderRadius: 10,
    backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center',
  },
  continueBtnText: { fontSize: 15, fontWeight: '700', color: Colors.bg },
});

// ─── Main Learn Screen ────────────────────────────────────────────────────────
const LEARN_TABS: { key: LearnTab; label: string; icon: string }[] = [
  { key: 'curriculum', label: '커리큘럼', icon: '📚' },
  { key: 'tactics',    label: '전술',    icon: '🧠' },
  { key: 'quiz',       label: '퀴즈',       icon: '❓' },
  { key: 'ai_coach',   label: 'AI 코치',   icon: '🤖' },
];

export default function LearnScreen() {
  const [activeTab, setActiveTab] = useState<LearnTab>('curriculum');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>학습</Text>
        <Text style={styles.headerSub}>Hockey IQ Training</Text>
      </View>

      {/* Sub-tab bar */}
      <View style={styles.subTabBar}>
        {LEARN_TABS.map(({ key, label, icon }) => (
          <Pressable
            key={key}
            style={[styles.subTab, activeTab === key && styles.subTabActive]}
            onPress={() => setActiveTab(key)}
          >
            <Text style={styles.subTabIcon}>{icon}</Text>
            <Text style={[styles.subTabLabel, activeTab === key && styles.subTabLabelActive]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {activeTab === 'curriculum' && <CurriculumTab />}
        {activeTab === 'tactics'    && <TacticsTab />}
        {activeTab === 'quiz'       && <QuizTab />}
        {activeTab === 'ai_coach'   && <AICoachTab />}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
  },
  headerSub: {
    fontSize: 12,
    color: Colors.subtext,
    marginTop: 2,
  },

  // Sub-tab bar
  subTabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  subTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    gap: 2,
  },
  subTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.accent,
  },
  subTabIcon: {
    fontSize: 16,
  },
  subTabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.subtext,
  },
  subTabLabelActive: {
    color: Colors.accent,
  },

  // Content area
  tabContent: {
    flex: 1,
    backgroundColor: Colors.bg,
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Progress card
  progressCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  progressPct: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.accent,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    marginBottom: 6,
  },
  progressBarFill: {
    height: 6,
    backgroundColor: Colors.accent,
    borderRadius: 3,
  },
  progressSub: {
    fontSize: 11,
    color: Colors.subtext,
  },

  // Phase accordion
  phaseCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  phaseTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  phaseNum: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.accent,
    letterSpacing: 0.5,
  },
  phaseTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 2,
  },
  phaseSub: {
    fontSize: 11,
    color: Colors.subtext,
    lineHeight: 15,
    marginBottom: 4,
  },
  phaseProgress: {
    fontSize: 11,
    color: Colors.subtext,
  },
  diffBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  diffBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  chevron: {
    fontSize: 20,
    color: Colors.subtext,
    fontWeight: '700',
  },
  weekList: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  weekRowLocked: {
    opacity: 0.5,
  },
  weekTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  weekMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weekMetaText: {
    fontSize: 10,
    color: Colors.subtext,
    fontWeight: '600',
  },
  weekRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lockIcon: {
    fontSize: 14,
  },
  checkIcon: {
    fontSize: 14,
    color: '#00CC66',
    fontWeight: '800',
  },

  // Week detail modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 12,
    color: Colors.subtext,
    lineHeight: 16,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  daySection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  dayTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.accent,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  lessonIcon: {
    fontSize: 18,
    width: 28,
    textAlign: 'center',
  },
  lessonTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  lessonMeta: {
    fontSize: 10,
    color: Colors.subtext,
    textTransform: 'capitalize',
  },

  // Tactics tab
  filterScroll: {
    maxHeight: 44,
    marginBottom: 12,
  },
  filterContent: {
    gap: 8,
    paddingHorizontal: 0,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.accent + '22',
    borderColor: Colors.accent,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.subtext,
  },
  filterChipTextActive: {
    color: Colors.accent,
  },
  tacticGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 32,
  },
  tacticCard: {
    width: (SCREEN_W - 48) / 2,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  tacticCardTop: {
    flexDirection: 'row',
  },
  diffPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  diffPillText: {
    fontSize: 9,
    fontWeight: '700',
  },
  tacticCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.text,
    lineHeight: 15,
  },
  tacticCardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tacticCardCategory: {
    fontSize: 9,
    color: Colors.subtext,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  tacticCardSteps: {
    fontSize: 9,
    color: Colors.subtext,
  },
  tacticPlayBtn: {
    backgroundColor: Colors.accent + '22',
    borderRadius: 6,
    paddingVertical: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.accent + '44',
  },
  tacticPlayText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.accent,
  },
  upgradeCard: {
    width: (SCREEN_W - 48) / 2,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 120,
  },
  upgradeIcon: {
    fontSize: 24,
  },
  upgradeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  upgradeSub: {
    fontSize: 10,
    color: Colors.subtext,
    textAlign: 'center',
  },
  animatorModal: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  animatorModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  animatorModalTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },

  // Quiz
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.subtext,
    letterSpacing: 0.5,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  selectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  selectorBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  selectorBtnActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + '22',
  },
  selectorBtnDisabled: {
    opacity: 0.4,
  },
  selectorBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.subtext,
  },
  selectorBtnTextActive: {
    color: Colors.accent,
  },
  freeNotice: {
    backgroundColor: '#FFD70022',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFD70066',
  },
  freeNoticeText: {
    fontSize: 12,
    color: '#FFD700',
    textAlign: 'center',
    fontWeight: '600',
  },
  primaryBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnDisabled: {
    opacity: 0.4,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.bg,
  },

  // Quiz player
  quizProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  quizProgressLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.subtext,
    minWidth: 40,
  },
  quizProgressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
  },
  quizProgressBarFill: {
    height: 6,
    backgroundColor: Colors.accent,
    borderRadius: 3,
  },
  quizMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  quizCategory: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.subtext,
    letterSpacing: 0.5,
  },
  situationBox: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  situationLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.accent,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  situationText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 19,
  },
  questionText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 21,
    marginBottom: 16,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  optionSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + '11',
  },
  optionCorrect: {
    borderColor: '#00CC66',
    backgroundColor: '#00CC6611',
  },
  optionWrong: {
    borderColor: '#FF3B30',
    backgroundColor: '#FF3B3011',
  },
  optionLetter: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.accent,
    width: 18,
  },
  optionBtnText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  feedbackBox: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    marginBottom: 12,
    borderWidth: 1,
  },
  feedbackTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
  },
  feedbackExplanation: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 19,
  },

  // Results
  resultsCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 12,
  },
  resultsScore: {
    fontSize: 64,
    fontWeight: '900',
    color: Colors.accent,
    lineHeight: 72,
  },
  resultsScoreLabel: {
    fontSize: 18,
    color: Colors.subtext,
    fontWeight: '600',
    marginBottom: 12,
  },
  iqBadge: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 2,
    marginBottom: 10,
  },
  iqBadgeText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  resultsDetail: {
    fontSize: 13,
    color: Colors.subtext,
  },
  section: {
    marginBottom: 20,
  },
  reviewCard: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  reviewQ: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  reviewAnswer: {
    fontSize: 12,
    fontWeight: '600',
  },
  reviewExplanation: {
    fontSize: 12,
    color: Colors.subtext,
    lineHeight: 17,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 6,
    marginTop: 2,
  },

  // AI Coach lock
  lockScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  lockTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
  },
  lockSub: {
    fontSize: 14,
    color: Colors.subtext,
    textAlign: 'center',
    lineHeight: 20,
  },
  lockFeatureList: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  lockFeatureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  lockFeatureDot: {
    color: Colors.accent,
    fontWeight: '700',
    marginTop: 1,
  },
  lockFeatureText: {
    fontSize: 13,
    color: Colors.text,
    flex: 1,
  },

  // AI Coach game list
  gameCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  gameCardSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + '11',
  },
  gameCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  gameCardSub: {
    fontSize: 11,
    color: Colors.subtext,
    marginBottom: 6,
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 48,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.subtext,
    textAlign: 'center',
  },

  // AI Coach player
  backBtn: {
    marginBottom: 16,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.accent,
  },
  coachGameTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 20,
  },
  aiSuggestionCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  aiSuggestionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  aiSuggestionText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 19,
  },
  aiLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.accent,
    letterSpacing: 0.8,
    marginTop: 4,
  },
  aiActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  notice: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noticeText: {
    fontSize: 12,
    color: Colors.subtext,
    lineHeight: 17,
    textAlign: 'center',
  },
});
