import { AnimatePresence, motion } from 'framer-motion';
import {
  IconCalendar,
  IconCheckbox,
  IconConfetti,
  IconFlame,
  IconHandLoveYou,
  IconMoon,
  IconMoodSmile,
  IconPencil,
  IconSparkles,
  IconStar,
  IconSun,
  IconTrophy,
} from '@tabler/icons-react';
import {
  BarChart3,
  Box,
  Check,
  ChevronLeft,
  Clock3,
  Download,
  Eraser,
  History,
  Layers3,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { BIG_NINE_DIVISOR_LIST, DIVISOR_LIST, MODE_GROUPS } from './lib/game-modes';
import { getAccuracyPercent } from './lib/history';
import { cn } from './lib/utils';
import {
  GROUP_LABELS,
  MODE_LABELS,
  SHAPE_GROUP_LABELS,
  prettyExpression,
  prettyModeName,
} from './lib/ui-labels';
import { useChart, useExportTool, useGame, useHistoryStore, useThreeScene, useToast } from './hooks';
import type { ExamShapeDef, HistoryRecord, ResultItem, TrainLogItem, ViewState } from './types';

const sectionTone = (groupKey: string) => {
  if (groupKey === 'space') return 'space';
  if (groupKey === 'divSelect' || groupKey === 'bigNineDivSelect') return 'special';
  return 'mental';
};

function SectionTitle({ groupKey, children }: { groupKey: string; children: React.ReactNode }) {
  const tone = sectionTone(groupKey);

  return (
    <div className={cn('section-title', `section-title-${tone}`)}>
      <span className={cn('section-title-bar', `section-title-bar-${tone}`)} />
      <span>{children}</span>
    </div>
  );
}

type TagIconName = 'pencil' | 'confetti' | 'trophy' | 'flame' | 'hand' | 'smile' | 'sun' | 'moon' | 'sparkles';

interface DailyTagState {
  text: string;
  icon: TagIconName;
  surprise: boolean;
  review: {
    hasData: boolean;
    monthDays: number;
    totalQuestions: number;
    bestModeName: string;
    streakDays: number;
  };
  progress: {
    completed: number;
    target: number;
  };
}

const DAILY_TAG_KEY = 'calc_daily_tag_v1';
const dateKey = (ts: number) => {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const todayKey = () => dateKey(Date.now());
const dayMs = 24 * 60 * 60 * 1000;

const dailyTagContext = createContext<DailyTagState | null>(null);

const iconForTag = (name: TagIconName) => {
  const props = { size: 12, stroke: 1.8 };
  if (name === 'confetti') return <IconConfetti {...props} />;
  if (name === 'trophy') return <IconTrophy {...props} />;
  if (name === 'flame') return <IconFlame {...props} />;
  if (name === 'hand') return <IconHandLoveYou {...props} />;
  if (name === 'smile') return <IconMoodSmile {...props} />;
  if (name === 'sun') return <IconSun {...props} />;
  if (name === 'moon') return <IconMoon {...props} />;
  if (name === 'sparkles') return <IconSparkles {...props} />;
  return <IconPencil {...props} />;
};

const parseDurationSeconds = (duration: string) => {
  const value = Number.parseFloat(duration.replace('s', ''));
  return Number.isFinite(value) ? value : 0;
};

const computeStreakDays = (dates: string[]) => {
  const set = new Set(dates);
  if (set.size === 0) return 0;
  const today = todayKey();
  const yesterday = dateKey(Date.now() - dayMs);
  let cursorKey: string;
  if (set.has(today)) cursorKey = today;
  else if (set.has(yesterday)) cursorKey = yesterday;
  else return 0;
  let count = 0;
  while (set.has(cursorKey)) {
    count += 1;
    const d = new Date(`${cursorKey}T00:00:00`);
    d.setDate(d.getDate() - 1);
    cursorKey = dateKey(d.getTime());
  }
  return count;
};

const choose = <T,>(items: T[], seed: number) => items[Math.abs(seed) % items.length];

function buildDailyTag(historyList: HistoryRecord[]): DailyTagState {
  const today = todayKey();
  const raw = localStorage.getItem(DAILY_TAG_KEY);
  const saved = raw ? JSON.parse(raw) as {
    date?: string;
    text?: string;
    icon?: TagIconName;
    surprise?: boolean;
    triggeredMilestones?: string[];
  } : {};
  const triggered = new Set(saved.triggeredMilestones || []);

  const dates = historyList.map((record) => dateKey(record.ts));
  const uniqueDates = Array.from(new Set(dates));
  const streakDays = computeStreakDays(uniqueDates);
  const totalQuestions = historyList.reduce((sum, record) => sum + (record.detail?.length || 0), 0);
  const modeStats = new Map<string, { name: string; count: number; totalSec: number; questions: number }>();

  historyList.forEach((record) => {
    const current = modeStats.get(record.mode) || { name: prettyExpression(record.modeName), count: 0, totalSec: 0, questions: 0 };
    current.count += 1;
    current.totalSec += parseDurationSeconds(record.duration);
    current.questions += record.detail?.length || 0;
    modeStats.set(record.mode, current);
  });

  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthRecords = historyList.filter((record) => dateKey(record.ts).startsWith(monthPrefix));
  const todayRecords = historyList.filter((record) => dateKey(record.ts) === today);
  const monthDays = new Set(monthRecords.map((record) => dateKey(record.ts))).size;
  const monthQuestions = monthRecords.reduce((sum, record) => sum + (record.detail?.length || 0), 0);
  const bestMode = Array.from(modeStats.values()).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return (a.totalSec / Math.max(1, a.questions)) - (b.totalSec / Math.max(1, b.questions));
  })[0];

  const review = {
    hasData: monthRecords.length > 0,
    monthDays,
    totalQuestions: monthQuestions,
    bestModeName: bestMode?.name || '',
    streakDays,
  };
  const progress = {
    completed: todayRecords.length,
    target: 5,
  };
  const persistedModeStats = Object.fromEntries(Array.from(modeStats.entries()).map(([mode, stat]) => [
    mode,
    {
      name: stat.name,
      count: stat.count,
      totalSec: stat.totalSec,
      questions: stat.questions,
      averageSecPerQuestion: stat.questions > 0 ? stat.totalSec / stat.questions : 0,
    },
  ]));
  const lastPracticeDate = uniqueDates.sort().at(-1) || '';

  if (saved.date === today && saved.text && saved.icon) {
    localStorage.setItem(DAILY_TAG_KEY, JSON.stringify({
      ...saved,
      totalQuestions,
      streakDays,
      lastPracticeDate,
      modeStats: persistedModeStats,
    }));
    return { text: saved.text, icon: saved.icon, surprise: !!saved.surprise, review, progress };
  }

  let next = { text: '', icon: 'pencil' as TagIconName, surprise: false };
  const streakMilestones = [3, 7, 14, 30, 50, 100];
  const questionMilestones = [100, 500, 1000, 5000];
  const streakHit = streakMilestones.find((n) => streakDays >= n && !triggered.has(`streak:${n}`));
  const questionHit = questionMilestones.find((n) => totalQuestions >= n && !triggered.has(`questions:${n}`));
  const modeHit = Array.from(modeStats.keys()).find((mode) => !triggered.has(`mode:${mode}`));

  if (streakHit) {
    triggered.add(`streak:${streakHit}`);
    next = {
      text: streakHit === 3 ? '三天啦,有点厉害' : streakHit === 7 ? '坚持一整周,了不起' : streakHit === 30 ? '满一个月,稳稳的' : `连续 ${streakHit} 天啦`,
      icon: streakHit >= 30 ? 'trophy' : 'confetti',
      surprise: true,
    };
  } else if (questionHit) {
    triggered.add(`questions:${questionHit}`);
    next = { text: `已经算过 ${questionHit} 道题了`, icon: 'trophy', surprise: true };
  } else if (modeHit) {
    triggered.add(`mode:${modeHit}`);
    next = { text: '解锁新练习,试试看', icon: 'confetti', surprise: true };
  } else if (streakDays >= 2) {
    next = { text: choose([`陪你到第 ${streakDays} 天啦`, `连续第 ${streakDays} 天,继续`, `第 ${streakDays} 天,稳住`], now.getDate()), icon: 'flame', surprise: false };
  } else {
    const lastDate = uniqueDates.sort().at(-1);
    const daysAway = lastDate ? Math.floor((new Date(today).getTime() - new Date(lastDate).getTime()) / dayMs) : 0;
    if (daysAway >= 2) {
      next = { text: choose(['欢迎回来呀', '又见面了,继续吧', '回来啦,正好练一组'], now.getDate()), icon: daysAway > 5 ? 'hand' : 'smile', surprise: false };
    } else {
      const hour = now.getHours();
      const daily = hour >= 5 && hour < 11
        ? { text: '早呀,清醒一下大脑', icon: 'sun' as TagIconName }
        : hour >= 11 && hour < 14
          ? { text: '午后练一会儿吧', icon: 'sun' as TagIconName }
          : hour >= 14 && hour < 18
            ? { text: '下午加把劲', icon: 'sun' as TagIconName }
            : hour >= 18 && hour < 23
              ? { text: '睡前动动脑', icon: 'moon' as TagIconName }
              : { text: '夜深了,简单练一组', icon: 'moon' as TagIconName };
      const warmPool = ['数字也会想你的', '慢慢来,不着急', '今天的大脑状态不错', '练一组就很棒了', '算得对不对都没关系,练就好', '你已经做得很好啦', '动动脑,心情会变好', '一点点进步也是进步', '今天也要加油呀', '深呼吸,开始吧', '你坚持的样子很好看'];
      next = Math.random() < 0.25 ? { text: choose(warmPool, now.getTime()), icon: 'sparkles', surprise: true } : { ...daily, surprise: false };
    }
  }

  localStorage.setItem(DAILY_TAG_KEY, JSON.stringify({
    date: today,
    text: next.text,
    icon: next.icon,
    surprise: next.surprise,
    triggeredMilestones: Array.from(triggered),
    totalQuestions,
    streakDays,
    lastPracticeDate,
    modeStats: persistedModeStats,
  }));

  return { ...next, review, progress };
}

function useDailyPracticeTag(historyList: HistoryRecord[]) {
  return useMemo(() => {
    try {
      return buildDailyTag(historyList);
    } catch (error) {
      console.error('Failed to build daily tag:', error);
      return {
        text: '今日练习',
        icon: 'pencil' as TagIconName,
        surprise: false,
        review: { hasData: false, monthDays: 0, totalQuestions: 0, bestModeName: '', streakDays: 0 },
        progress: { completed: 0, target: 5 },
      };
    }
  }, [historyList]);
}

function Button({
  children,
  className,
  variant = 'primary',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  return (
    <button
      className={cn(
        'inline-flex h-12 min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-lg px-4 text-center text-[16px] font-semibold tracking-normal transition active:scale-[0.99] disabled:bg-[#EEF1F2] disabled:text-[#A9B4B9] disabled:opacity-100',
        variant === 'primary' && 'primary-control',
        variant === 'secondary' && 'secondary-control',
        variant === 'ghost' && 'bg-control text-ink hairline active:bg-pressed',
        variant === 'danger' && 'semantic-error hairline',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function ProgressRing({ completed, target }: { completed: number; target: number }) {
  const done = target > 0 && completed >= target;
  const ratio = Math.min(1, target > 0 ? completed / target : 0);
  const degrees = Math.round(ratio * 360);

  return (
    <div
      className="relative grid h-[62px] w-[62px] shrink-0 place-items-center"
      style={{ borderRadius: '50%', background: `conic-gradient(#B5879A ${done ? 360 : degrees}deg, #F0E6EA 0deg)` }}
      aria-label={`今日进度 ${completed}/${target}`}
    >
      <div className="absolute grid h-[46px] w-[46px] place-items-center bg-white" style={{ borderRadius: '50%' }}>
        {done ? (
          <div className="flex flex-col items-center gap-[2px] leading-none">
            <Check className="h-[18px] w-[18px] text-[#B5879A]" strokeWidth={2.6} />
            <span className="text-[10px] font-bold text-[#4A3E44]">{completed} 组</span>
          </div>
        ) : (
          <div className="text-center leading-none">
            <div className="text-[13px] font-bold text-[#4A3E44]">{completed}/{target}</div>
            <div className="mt-[3px] text-[9px] font-medium text-[#A8A1A6]">今日</div>
          </div>
        )}
      </div>
    </div>
  );
}

function PageHeader({ title, subtitle, showProgress = false }: { title: string; subtitle?: string; showProgress?: boolean }) {
  const dailyTag = useContext(dailyTagContext);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const tag = dailyTag || {
    text: '今日练习',
    icon: 'pencil' as TagIconName,
    surprise: false,
    review: { hasData: false, monthDays: 0, totalQuestions: 0, bestModeName: '', streakDays: 0 },
    progress: { completed: 0, target: 5 },
  };

  return (
    <div ref={wrapRef} className="mt-4 mb-3 shrink-0 rounded-[22px] border-[0.5px] border-[#ECE4E7] bg-white px-5 py-[18px]">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <button
            className={cn(
              'inline-flex items-center gap-[3px] rounded-[8px] bg-[#F7EDF0] px-[13px] py-[5px] text-[11px] font-medium leading-none text-[#B5879A] transition',
              tag.surprise && 'scale-[1.04] bg-[#F5E7EC]',
            )}
            onClick={() => setOpen((value) => !value)}
          >
            {iconForTag(tag.icon)}
            <span>{tag.text}</span>
          </button>
          <h1 className="mt-[10px] text-[28px] font-bold leading-tight tracking-[-0.5px] text-[#3A2F34]">{title}</h1>
          {subtitle ? <p className="mt-1 text-[12px] font-normal leading-5 text-[#A892A0]">{subtitle}</p> : null}
          <div className="mt-3 flex items-center gap-[5px]">
            <span className="h-1 w-6 rounded-sm bg-[#D9A7B8]" />
            <span className="h-1 w-[10px] rounded-sm bg-[#E8C9D3]" />
            <span className="h-1 w-[10px] rounded-sm bg-[#DCE6EC]" />
          </div>
        </div>
        {showProgress ? <ProgressRing completed={tag.progress.completed} target={tag.progress.target} /> : null}
      </div>
      <AnimatePresence>
        {open ? (
          <motion.div
            className="mt-2 rounded-xl border-[0.5px] border-[#ECE4E7] bg-white p-4 text-[12px] text-[#A892A0]"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            {tag.review.hasData ? (
              <div className="grid gap-2">
                <div className="flex items-center gap-2"><IconCalendar size={15} color="#B5879A" /><span>这个月你练了 <b className="text-[#4A3E44]">{tag.review.monthDays}</b> 天</span></div>
                <div className="flex items-center gap-2"><IconCheckbox size={15} color="#7E9CAC" /><span>本月一共算了 <b className="text-[#4A3E44]">{tag.review.totalQuestions}</b> 道题</span></div>
                {tag.review.bestModeName ? <div className="flex items-center gap-2"><IconStar size={15} color="#B5879A" /><span>最擅长 <b className="text-[#4A3E44]">{tag.review.bestModeName}</b></span></div> : null}
                <div className="flex items-center gap-2"><IconFlame size={15} color="#7E9CAC" /><span>目前连续 <b className="text-[#4A3E44]">{tag.review.streakDays}</b> 天</span></div>
                <div className="pt-1 text-[#B5879A]">这个月很努力呀</div>
              </div>
            ) : (
              <div className="flex items-center gap-2"><IconSparkles size={15} color="#B5879A" />练满几天,这里就有你的记录啦</div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function Screen({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={cn('safe-page', className)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function HomeView({
  currentModeKey,
  setMode,
  toSelectDivisor,
  toSelectBigNineDivisor,
  startGame,
  openHistory,
  startCubicMode,
}: {
  currentModeKey: string;
  setMode: (mode: string) => void;
  toSelectDivisor: () => void;
  toSelectBigNineDivisor: () => void;
  startGame: () => void;
  openHistory: () => void;
  startCubicMode: (mode: 'block' | 'section') => void;
}) {
  return (
    <Screen>
      <PageHeader title="计算助手" subtitle="每天一点点,心算更轻松" showProgress />
      <div className="surface flex min-h-0 flex-1 flex-col rounded-xl p-[14px]">
        <div className="scroll-clean min-h-0 flex-1 pr-1">
            {Object.entries(MODE_GROUPS).map(([groupKey, group]) => (
              <section key={groupKey} className="mt-5">
                <SectionTitle groupKey={groupKey}>{GROUP_LABELS[groupKey] || group.label}</SectionTitle>
                {groupKey === 'divSelect' ? (
                  <Button variant="secondary" className="tone-special h-[52px] w-full" onClick={toSelectDivisor}>
                    商首位除数选择 <ChevronLeft className="h-4 w-4 rotate-180" />
                  </Button>
                ) : groupKey === 'bigNineDivSelect' ? (
                  <Button variant="secondary" className="tone-special h-[52px] w-full" onClick={toSelectBigNineDivisor}>
                    大九九除法专项 <ChevronLeft className="h-4 w-4 rotate-180" />
                  </Button>
                ) : (
                  <div className="grid grid-cols-2 gap-[10px] sm:grid-cols-3">
                    {group.modes.map((modeKey) => (
                      <button
                        key={modeKey}
                        className={cn(
                          'flex h-[52px] items-center justify-center rounded-lg px-3 text-center text-[15px] font-semibold whitespace-nowrap transition active:scale-[0.99]',
                          currentModeKey === modeKey
                            ? 'selected-control'
                            : 'tone-mental',
                        )}
                        onClick={() => setMode(modeKey)}
                      >
                        {MODE_LABELS[modeKey] || modeKey}
                      </button>
                    ))}
                  </div>
                )}
              </section>
            ))}
            <section className="mt-5">
              <SectionTitle groupKey="space">空间思维</SectionTitle>
              <div className="grid grid-cols-2 gap-[10px]">
                <button
                  className="tone-space flex h-[52px] items-center justify-center gap-2 rounded-lg px-3 text-center text-[15px] font-semibold transition active:scale-[0.99]"
                  onClick={() => startCubicMode('block')}
                >
                  <Box className="h-5 w-5" /> 立体拼合
                </button>
                <button
                  className="tone-space flex h-[52px] items-center justify-center gap-2 rounded-lg px-3 text-center text-[15px] font-semibold transition active:scale-[0.99]"
                  onClick={() => startCubicMode('section')}
                >
                  <Layers3 className="h-5 w-5" /> 立体截面
                </button>
              </div>
            </section>
        </div>
        <div className="mt-[10px] mb-3 grid shrink-0 gap-[9px] border-t border-black/[0.06] pt-[14px]">
          <Button className="h-[50px] text-[17px]" onClick={startGame}>
            开始练习
          </Button>
          <Button variant="secondary" className="h-12 border-[#ECE4E7] text-[17px]" onClick={openHistory}>
            <History className="h-5 w-5" /> 历史记录
          </Button>
        </div>
      </div>
    </Screen>
  );
}

function SelectDivisorView({
  title,
  subtitle,
  divisorList,
  labelPrefix = '',
  onSelect,
  goHome,
}: {
  title: string;
  subtitle: string;
  divisorList: number[];
  labelPrefix?: string;
  onSelect: (d: number) => void;
  goHome: () => void;
}) {
  return (
    <Screen>
      <PageHeader title={title} subtitle={subtitle} />
      <div className="surface scroll-clean min-h-0 flex-1 rounded-xl p-[14px]">
        <div className="grid grid-cols-3 gap-[10px] sm:grid-cols-4 md:grid-cols-6">
          {divisorList.map((item) => (
            <button
              key={item}
              className="tone-special flex h-16 items-center justify-center rounded-lg text-center text-[20px] font-semibold transition active:scale-[0.99]"
              onClick={() => onSelect(item)}
            >
              {labelPrefix}{item}
            </button>
          ))}
        </div>
      </div>
      <Button variant="secondary" className="mt-4 h-14 w-full" onClick={goHome}>
        返回主页
      </Button>
    </Screen>
  );
}

function AnswerPanel({
  currentModeKey,
  input,
  inputArray,
  decompStep,
}: {
  currentModeKey: string;
  input: string;
  inputArray: string[];
  decompStep: number;
}) {
  const box = 'premium-control flex h-[58px] min-w-12 items-center justify-center rounded-lg px-3 text-center text-[30px] font-semibold text-ink';

  if (currentModeKey === 'divScale') {
    return (
      <div className="mt-5 flex items-center justify-center gap-3">
        <div className={cn(box, 'min-w-[120px]')}>{input.slice(0, 3) || '___'}</div>
        <div className="text-[24px] text-muted">÷</div>
        <div className={box}>{input.slice(3, 4) || '_'}</div>
      </div>
    );
  }

  if (['carryJudge', 'borrowJudge'].includes(currentModeKey)) {
    return (
      <div className="mt-5 grid grid-cols-3 gap-3">
        {['百位', '十位', '个位'].map((label, index) => (
          <div key={label} className="text-center">
            <div className="mb-2 text-[13px] font-medium text-muted">{label}</div>
            <div className={box}>{index === 2 ? '0' : inputArray[index] ?? '_'}</div>
          </div>
        ))}
      </div>
    );
  }

  if (currentModeKey === 'digitDetermine') {
    return (
      <div className="mt-5 flex justify-center gap-2">
        {[0, 1, 2, 3].map((index) => <div key={index} className={box}>{input[index] || '_'}</div>)}
      </div>
    );
  }

  if (['pairMult', 'decompAdd', 'firstDiffBorrow', 'middleDiffBorrow'].includes(currentModeKey)) {
    const labels = currentModeKey === 'pairMult' ? ['左边', '右边'] : currentModeKey === 'firstDiffBorrow' ? ['准确差', '退位差'] : currentModeKey === 'middleDiffBorrow' ? ['直接差', '借位后差'] : ['十位和', '个位和', '总和'];
    return (
      <div className="mt-5 grid gap-2">
        {labels.map((label, index) => (
          <div key={label} className="grid grid-cols-[72px_1fr] items-center gap-3">
            <span className="text-[14px] font-medium text-muted">{label}</span>
            <div className={cn(box, decompStep === index && 'selected-control')}>
              {decompStep === index ? (input || '_') : inputArray[index] || ''}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <div className="premium-control mt-5 rounded-lg px-4 py-4 text-center text-[36px] font-semibold text-ink">{input || '—'}</div>;
}

function GameView({
  game,
}: {
  game: ReturnType<typeof useGame>;
}) {
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const isJudge = ['carryJudge', 'borrowJudge'].includes(game.currentModeKey);
  const isRatioExpr = game.currentModeKey === 'ratioExpr';

  return (
    <Screen className="gap-[10px]">
      <div className="flex shrink-0 items-center gap-[10px]">
        <Button variant="secondary" className="h-11 px-4" onClick={game.goHome}>
          <ChevronLeft className="h-5 w-5" /> 返回
        </Button>
        <div className="ml-auto flex items-center gap-[10px]">
          <div className="rounded-md bg-accentSoft px-3 py-2 text-center text-[14px] font-semibold text-accentDeep">{game.progressText}</div>
          <div className="inline-flex items-center justify-center gap-1 rounded-md bg-accentSoft px-3 py-2 text-center text-[14px] font-semibold text-accentDeep">
            <Clock3 className="h-4 w-4" />{game.totalText}
          </div>
        </div>
      </div>

      <div className={cn('surface flex min-h-0 flex-1 flex-col rounded-xl p-[14px]', isRatioExpr ? 'justify-start text-left' : 'justify-center text-center')}>
        <div className={cn(
          'font-semibold tracking-normal text-ink',
          isRatioExpr ? 'mx-auto max-w-[620px] text-[22px] leading-[1.65] md:text-[26px]' : game.isSmallFont ? 'text-[46px]' : 'text-[64px] md:text-[84px]',
        )}>
          {prettyExpression(game.qText)}
        </div>
        <div className={cn('mx-auto mt-2 max-w-[520px] text-[15px] leading-6 text-muted', isRatioExpr && 'text-center')}>
          {prettyExpression(game.activeConfig.hintNote || game.activeConfig.hint || '精确到整数')}
        </div>
        <AnswerPanel
          currentModeKey={game.currentModeKey}
          input={game.input}
          inputArray={game.inputArray}
          decompStep={game.decompStep}
        />
        {game.uiHint ? <div className="semantic-error mt-4 rounded-md px-3 py-2 text-[15px] font-semibold">{game.uiHint}</div> : null}
      </div>

      <div className="surface shrink-0 rounded-xl p-[14px]">
        <div className="game-function-row mb-[10px] grid grid-cols-3 gap-[10px]">
          <Button variant="ghost" className="h-13 tone-special" onClick={game.leftAction}>{game.leftText}</Button>
          <Button variant="ghost" className="h-13 tone-special" onClick={game.clearInput}>清空</Button>
          <Button variant="ghost" className="h-13 tone-danger-soft" onClick={game.backspace}>退格</Button>
        </div>
        {isJudge ? (
          <div className="grid grid-cols-2 gap-[10px]">
            <button className="tone-number flex h-[120px] flex-col items-center justify-center rounded-lg text-center text-[44px] font-semibold leading-none" onClick={() => game.pressDigit(game.currentModeKey === 'borrowJudge' ? '-1' : '1')}>
              <span>{game.currentModeKey === 'borrowJudge' ? '退位' : '进位'}</span>
              <span className="mt-1 text-[14px] font-medium text-muted">{game.currentModeKey === 'borrowJudge' ? '退位' : '进位'}</span>
            </button>
            <button className="tone-number flex h-[120px] flex-col items-center justify-center rounded-lg text-center text-[44px] font-semibold leading-none" onClick={() => game.pressDigit('0')}>
              <span>0</span>
              <span className="mt-1 text-[14px] font-medium text-muted">不变</span>
            </button>
            <Button className="col-span-2 h-14" onClick={game.confirmAnswer}>确认</Button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-[10px]">
            {digits.map((item) => (
              <button key={item} className="tone-number flex h-[64px] items-center justify-center rounded-lg text-center text-[28px] font-semibold leading-none active:scale-[0.99]" onClick={() => game.pressDigit(item)}>
                {item}
              </button>
            ))}
            <button className="tone-number flex h-[64px] items-center justify-center rounded-lg text-center text-[28px] font-semibold leading-none active:scale-[0.99]" onClick={game.pressDot}>{isRatioExpr ? ',' : '.'}</button>
            <button className="tone-number flex h-[64px] items-center justify-center rounded-lg text-center text-[28px] font-semibold leading-none active:scale-[0.99]" onClick={() => game.pressDigit(0)}>0</button>
            <Button className="h-[64px] rounded-lg" onClick={game.confirmAnswer}><Check className="h-5 w-5" /></Button>
          </div>
        )}
        </div>
    </Screen>
  );
}

function ResultView({
  game,
  backToHistory,
}: {
  game: ReturnType<typeof useGame>;
  backToHistory: () => void;
}) {
  const items = game.currentModeKey === 'train' ? game.trainLog : game.results;

  return (
    <Screen>
      <PageHeader title={prettyExpression(game.resultTitle)} subtitle={game.resultMeta} />
      <div className="surface scroll-clean min-h-0 flex-1 rounded-xl p-[14px]">
        {items.map((raw, index) => {
          const item = raw as ResultItem & TrainLogItem;
          const isResult = 'ok' in item;
          return (
            <div key={index} className="flex gap-3 border-b border-black/[0.06] px-2 py-4 last:border-b-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accentSoft text-[13px] font-semibold text-accentDeep">{index + 1}</div>
              <div className="min-w-0 flex-1">
                <div className="break-words text-[16px] font-semibold text-ink">
                  {prettyExpression(isResult ? `${item.q} = ${item.yourAns}` : item.q)}
                </div>
                <div className="mt-1 text-[13px] text-muted">
                  {item.usedStr}{!isResult ? ` · 错 ${item.wrong}${item.skipped ? ' · 跳过' : ''}` : item.detailTimes ? ` · ${item.detailTimes}` : ''}
                </div>
              </div>
              {isResult ? (
                <div className={cn('flex flex-col items-end justify-center self-center rounded-md px-2 py-1 text-right text-[14px] font-semibold', item.ok ? 'semantic-success' : 'semantic-error')}>
                  <span>{item.ok ? '正确' : `答案 ${prettyExpression(item.realAns)}`}</span>
                  {item.exactAns ? <span className="mt-1 text-[11px] font-medium text-muted">准 {item.exactAns} · 误 {item.errorRate}</span> : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="mt-[10px] grid grid-cols-2 gap-[10px]">
        {game.isHistoryReview ? (
          <Button className="col-span-2 h-14" onClick={backToHistory}>返回列表</Button>
        ) : (
          <>
              <Button className="h-14" onClick={game.goHome}>返回主页</Button>
              <Button variant="secondary" className="h-14" onClick={game.startGame}><RotateCcw className="h-5 w-5" /> 再来一组</Button>
          </>
        )}
      </div>
    </Screen>
  );
}

function formatLastSyncedAt(ts: number | null): string {
  if (!ts) return '尚未成功同步';
  const diffMs = Math.max(0, Date.now() - ts);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diffMs < minute) return '刚刚同步';
  if (diffMs < hour) return `${Math.floor(diffMs / minute)} 分钟前同步`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)} 小时前同步`;
  return `上次同步 ${new Date(ts).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

function HistoryView({
  historyList,
  syncState,
  syncMessage,
  pendingCount,
  lastSyncedAt,
  chart,
  exportTool,
  lowAccuracyCount,
  viewHistoryDetail,
  clearLowAccuracy,
  clearPartial,
  clearHistory,
  retrySync,
  closeHistory,
}: {
  historyList: HistoryRecord[];
  syncState: 'idle' | 'syncing' | 'ok' | 'error';
  syncMessage: string;
  pendingCount: number;
  lastSyncedAt: number | null;
  chart: ReturnType<typeof useChart>;
  exportTool: ReturnType<typeof useExportTool>;
  lowAccuracyCount: number;
  viewHistoryDetail: (index: number) => void;
  clearLowAccuracy: () => void;
  clearPartial: () => void;
  clearHistory: () => void;
  retrySync: () => void;
  closeHistory: () => void;
}) {
  const hasSuccessfulSync = lastSyncedAt !== null;
  const canRetrySync = syncState === 'error' || (pendingCount > 0 && syncState !== 'syncing');
  const syncTitle = syncState === 'syncing'
    ? pendingCount > 0 ? `正在同步云端记录 · 待上传 ${pendingCount} 条` : '正在同步云端记录'
    : syncState === 'error'
      ? pendingCount > 0 ? `离线保存 · 待上传 ${pendingCount} 条` : '云端同步失败'
      : pendingCount > 0
        ? `离线保存 · 待上传 ${pendingCount} 条`
        : hasSuccessfulSync
          ? `同步成功 · ${formatLastSyncedAt(lastSyncedAt)}`
          : '尚未同步云端记录';
  const syncDetail = syncState === 'error'
    ? (syncMessage || '请稍后重试')
    : pendingCount > 0
      ? '记录已保存在本机，网络恢复后会继续上传'
      : hasSuccessfulSync
        ? '本地与云端记录已更新'
        : '打开历史页时会自动同步云端记录';
  const syncTone = syncState === 'error'
    ? 'bg-red-50 text-red-700'
    : pendingCount > 0
      ? 'bg-amber-50 text-amber-700'
      : 'bg-[#F4F7F8] text-muted';
  const dotTone = syncState === 'error'
    ? 'bg-red-500'
    : syncState === 'syncing'
      ? 'bg-accent'
      : pendingCount > 0
        ? 'bg-amber-500'
        : hasSuccessfulSync
          ? 'bg-emerald-500'
          : 'bg-hint';

  return (
    <Screen>
      <PageHeader title="计算助手" subtitle="每天一点点,心算更轻松" />
      <div className="surface flex min-h-0 flex-1 flex-col rounded-xl p-[14px]">
        <div className="grid shrink-0 gap-[10px] sm:grid-cols-2">
          <Button variant="secondary" onClick={chart.showChart ? chart.closeChart : chart.initChart}>
            <BarChart3 className="h-5 w-5" /> {chart.showChart ? '收起图表' : '趋势分析'}
          </Button>
          <Button variant="secondary" onClick={exportTool.showExport ? exportTool.closeExport : exportTool.openExport}>
            <Download className="h-5 w-5" /> {exportTool.showExport ? '收起导出' : '导出数据'}
          </Button>
        </div>

        {chart.showChart ? (
          <div className="mt-[10px] shrink-0 rounded-xl bg-[#F4F7F8] p-[14px] hairline">
            <div className="scroll-clean mb-[10px] flex flex-nowrap gap-2 overflow-x-auto pb-1">
              {chart.availableModes.map((mode) => (
                <button key={mode} className={cn('h-9 max-w-[132px] shrink-0 truncate rounded-md px-3 text-[12px] font-semibold leading-9 whitespace-nowrap', chart.chartTab === mode ? 'selected-control' : 'premium-control')} onClick={() => chart.switchChartTab(mode)} title={prettyExpression(mode)}>
                  {prettyExpression(mode)}
                </button>
              ))}
            </div>
            <div id="accChart" className="h-[150px] w-full sm:h-[220px]" />
          </div>
        ) : null}

        {exportTool.showExport ? (
          <div className="mt-[10px] rounded-xl bg-[#F4F7F8] p-[14px] hairline">
            <div className="mb-[10px] grid grid-cols-2 gap-[10px]">
              {(['csv', 'text'] as const).map((format) => (
                <button key={format} className={cn('h-10 rounded-lg text-[14px] font-semibold', exportTool.exportFormat === format ? 'selected-control' : 'premium-control')} onClick={() => exportTool.setExportFormat(format)}>
                  {format === 'csv' ? 'CSV' : '文本报告'}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-[1fr_1fr_auto] gap-[10px]">
              <input type="date" className="h-11 min-w-0 rounded-lg bg-white px-3 text-[14px] text-ink hairline focus:border-accent focus:outline-none" value={exportTool.exportStart} onChange={(e) => exportTool.setExportStart(e.target.value)} />
              <input type="date" className="h-11 min-w-0 rounded-lg bg-white px-3 text-[14px] text-ink hairline focus:border-accent focus:outline-none" value={exportTool.exportEnd} onChange={(e) => exportTool.setExportEnd(e.target.value)} />
              <Button variant="ghost" className="h-11 px-4" onClick={exportTool.selectAllRange}>全部</Button>
            </div>
            <div className="mt-2 flex items-center justify-between text-[13px] text-muted">
              <span>已选 {exportTool.filteredCount} / {exportTool.totalCount} 条</span>
              <Button className="h-10 px-4 text-[14px]" onClick={exportTool.doExport}>导出</Button>
            </div>
          </div>
        ) : null}

        <div className={cn('mt-3 flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-[12px] hairline', syncTone)}>
          <span className={cn('h-2 w-2 shrink-0 rounded-full', dotTone)} />
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold">{syncTitle}</div>
            <div className="truncate opacity-80">{syncDetail}</div>
          </div>
          {canRetrySync ? (
            <button className="flex h-8 shrink-0 items-center gap-1 rounded-md bg-white px-3 text-[12px] font-semibold text-ink hairline active:bg-pressed" onClick={retrySync}>
              <RotateCcw className="h-3.5 w-3.5" /> {syncState === 'error' ? '重试' : '同步'}
            </button>
          ) : null}
        </div>

        <div className="mt-4 flex shrink-0 justify-between px-1 text-[13px] font-semibold text-muted">
          <span>时间 / 模式</span><span>成绩 / 耗时</span>
        </div>
        <div className="scroll-clean mt-2 min-h-0 flex-1">
          {historyList.length === 0 ? (
            <div className="py-12 text-center text-[15px] text-muted">暂无记录</div>
          ) : historyList.map((item, index) => (
            <button key={`${item.ts}-${index}`} className="flex w-full items-center gap-3 border-b border-black/[0.06] px-1 py-4 text-left last:border-b-0" onClick={() => viewHistoryDetail(index)}>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] text-muted">{item.timeStr}</div>
                <div className="truncate text-[16px] font-semibold text-ink">{prettyExpression(item.modeName)}</div>
              </div>
              <div className="text-right">
                <div className="text-[16px] font-semibold text-ink">{prettyExpression(item.summary)}</div>
                <div className="text-[12px] text-muted">{item.duration}</div>
              </div>
            </button>
          ))}
        </div>
        <div className="mt-[10px] grid shrink-0 grid-cols-2 gap-[10px]">
          {lowAccuracyCount > 0 ? <Button variant="ghost" className="col-span-2" onClick={clearLowAccuracy}>清理低正确率 {lowAccuracyCount} 条</Button> : null}
          <Button variant="danger" onClick={clearPartial}>清理部分</Button>
          <Button variant="danger" onClick={clearHistory}><Trash2 className="h-5 w-5" /> 清空全部</Button>
          <Button className="col-span-2" onClick={closeHistory}>返回主页</Button>
        </div>
      </div>
    </Screen>
  );
}

function CubicView({ three }: { three: ReturnType<typeof useThreeScene> }) {
  return (
    <motion.div className="h-full w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div id="three-container" ref={three.mountContainer} className="h-full w-full touch-none outline-none" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col items-center gap-[10px] px-[14px] pt-[max(16px,env(safe-area-inset-top))]">
        <div className="surface pointer-events-auto flex max-w-full items-center gap-[10px] overflow-x-auto rounded-xl p-[14px]">
          <Button variant="secondary" className="h-10 rounded-lg px-3" onClick={three.quitCubicMode}><X className="h-5 w-5" /></Button>
          {three.cubicMode === 'section' ? (
            <>
              <Button variant="secondary" className="h-10 rounded-lg px-3 text-[14px]" onClick={() => three.setShowShapeMenu(!three.showShapeMenu)}>题库 · {three.currentShapeName}</Button>
              <Button variant="secondary" className="h-10 rounded-lg px-3 text-[14px]" onClick={three.lookAtSection}>正视截面</Button>
            </>
          ) : (
            <>
              <div className="flex gap-1 px-1">
                {three.colors.map((color) => (
                  <button key={color} className={cn('h-8 w-8 rounded-full border transition active:scale-95', three.selectedColor === color && !three.isDeleteMode ? 'ring-2 ring-ink ring-offset-2' : '')} style={{ backgroundColor: color, borderColor: color === '#ffffff' ? '#d2d2d7' : 'transparent' }} onClick={() => three.switchColor(color)} />
                ))}
              </div>
              <Button variant={three.isDeleteMode ? 'primary' : 'secondary'} className="h-10 rounded-lg px-3" onClick={three.toggleDeleteMode}><Eraser className="h-5 w-5" /></Button>
              <Button variant="secondary" className="h-10 rounded-lg px-3" onClick={three.clearCubes}><Trash2 className="h-5 w-5" /></Button>
            </>
          )}
        </div>
        <div className="surface pointer-events-auto flex rounded-lg p-1">
          {[
            ['front', '正'],
            ['left', '左'],
            ['top', '俯'],
            ['iso', '轴'],
          ].map(([key, label]) => (
            <button key={key} className="h-9 rounded-md px-4 text-[14px] font-semibold text-ink active:bg-pressed" onClick={() => three.setCameraView(key as 'front' | 'left' | 'top' | 'iso')}>{label}</button>
          ))}
        </div>
        <div className="rounded-md bg-accentSoft px-3 py-2 text-[12px] font-medium text-accentDeep">
          {three.cubicMode === 'block' ? '点击地面放置，点击方块叠加或删除' : '调节下方滑块观察截面变化'}
        </div>
      </div>

      {three.showShapeMenu && three.cubicMode === 'section' ? (
        <div className="surface absolute left-[14px] top-24 z-20 max-h-[52vh] w-[280px] overflow-y-auto rounded-xl p-[14px]">
          {Object.entries(three.examShapes).map(([groupName, shapes]) => (
            <div key={groupName} className="mb-3">
              <div className="mb-2 px-1 text-[12px] font-semibold text-muted">{SHAPE_GROUP_LABELS[groupName] || groupName}</div>
              <div className="grid grid-cols-2 gap-[10px]">
                {(shapes as ExamShapeDef[]).map((shape) => (
                  <button key={shape.name} className="premium-control rounded-lg px-2 py-3 text-[13px] font-semibold text-ink" onClick={() => three.loadExamShape(shape)}>
                    {prettyExpression(shape.name)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {three.cubicMode === 'section' ? (
        <div className={cn('surface absolute inset-x-[14px] bottom-[max(16px,env(safe-area-inset-bottom))] z-20 mx-auto max-w-[520px] rounded-xl p-[14px] transition-transform', three.sliceMenuCollapsed && 'translate-y-[calc(100%-64px)]')}>
          <button className="flex w-full items-center justify-between pb-3" onClick={() => three.setSliceMenuCollapsed(!three.sliceMenuCollapsed)}>
            <span className="text-[17px] font-semibold">切面调节</span>
            <span className="rounded-full bg-black/[0.05] px-3 py-1 text-[13px] font-semibold text-ink">{three.sliceMenuCollapsed ? '展开' : '收起'}</span>
          </button>
          {!three.sliceMenuCollapsed ? (
            <div className="grid gap-[10px]">
              {[
                ['constant', '位移', -8, 8, 0.1],
                ['rotX', 'X 旋转', 0, 180, 1],
                ['rotY', 'Y 旋转', 0, 180, 1],
                ['rotZ', 'Z 旋转', 0, 180, 1],
              ].map(([key, label, min, max, step]) => (
                <label key={key as string} className="grid grid-cols-[64px_1fr] items-center gap-[10px] text-[13px] font-medium text-muted">
                  {label}
                  <input
                    type="range"
                    min={min as number}
                    max={max as number}
                    step={step as number}
                    value={three.sliceConfig[key as keyof typeof three.sliceConfig]}
                    onChange={(e) => three.updateSliceConfig({ [key as string]: Number(e.target.value) })}
                    className="accent-ink"
                  />
                </label>
              ))}
              <Button variant="secondary" className="h-11" onClick={three.resetSlice}>重置位置</Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </motion.div>
  );
}

export default function App() {
  const [viewState, setViewState] = useState<ViewState>('home');
  const { toast, showToast } = useToast();
  const history = useHistoryStore();
  const chart = useChart(history.list);
  const exportTool = useExportTool(history.list, showToast);
  const game = useGame({ viewState, setViewState, addRecord: history.addRecord });
  const three = useThreeScene(setViewState);
  const dailyTag = useDailyPracticeTag(history.list);
  const lowAccuracyCount = useMemo(
    () => history.list.filter((record) => {
      const accuracy = getAccuracyPercent(record);
      return accuracy !== null && accuracy < 30;
    }).length,
    [history.list],
  );

  const openHistory = () => {
    setViewState('history');
    chart.reopenIfActive();
    void history.refreshRemote().then(chart.reopenIfActive);
  };
  const backToHistory = () => {
    setViewState('history');
    chart.reopenIfActive();
    void history.refreshRemote().then(chart.reopenIfActive);
  };
  const viewHistoryDetail = (index: number) => game.viewHistoryDetail(history.list[index]);
  const clearPartial = () => {
    const total = history.list.length;
    if (total === 0) {
      showToast('暂无记录');
      return;
    }
    const raw = prompt(`当前共有 ${total} 条记录。\n输入要清理的最早记录条数：`, '100');
    if (raw == null) return;
    const n = parseInt(raw.trim(), 10);
    if (!Number.isFinite(n) || n <= 0) {
      showToast('请输入有效正整数');
      return;
    }
    const count = Math.min(n, total);
    void history.clearOldest(count);
    showToast(`已清理最早 ${count} 条`);
  };
  const clearLowAccuracy = () => {
    if (lowAccuracyCount === 0) {
      showToast('没有低正确率记录');
      return;
    }
    if (!confirm(`检测到 ${lowAccuracyCount} 条正确率低于 30% 的记录。\n确定删除这些记录吗？`)) return;
    void history.clearLowAccuracy();
    showToast(`已删除 ${lowAccuracyCount} 条`);
  };
  const clearHistory = () => {
    const total = history.list.length;
    if (total === 0) {
      showToast('暂无记录');
      return;
    }
    if (!confirm(`确定清空全部 ${total} 条历史记录吗？\n此操作不可恢复。`)) return;
    if (!confirm('再次确认：真的要清空全部历史吗？')) return;
    void history.clearAll();
    showToast('已清空');
  };

  return (
    <dailyTagContext.Provider value={dailyTag}>
    <div className="app-shell">
      <AnimatePresence mode="wait">
        {viewState === 'home' && (
          <HomeView
            key="home"
            currentModeKey={game.currentModeKey}
            setMode={game.setMode}
            toSelectDivisor={game.toSelectDivisor}
            toSelectBigNineDivisor={game.toSelectBigNineDivisor}
            startGame={game.startGame}
            openHistory={openHistory}
            startCubicMode={three.startCubicMode}
          />
        )}
        {viewState === 'selectDivisor' && (
          <SelectDivisorView
            key="selectDivisor"
            title="选择除数"
            subtitle="点击下方数字开始商首位专项练习。"
            divisorList={DIVISOR_LIST}
            onSelect={game.selectDivisorAndStart}
            goHome={game.goHome}
          />
        )}
        {viewState === 'selectBigNineDivisor' && (
          <SelectDivisorView
            key="selectBigNineDivisor"
            title="大九九除法"
            subtitle="选择除数，三位数随机被除数，商允许 3% 误差。"
            divisorList={BIG_NINE_DIVISOR_LIST}
            labelPrefix="÷"
            onSelect={game.selectBigNineDivisorAndStart}
            goHome={game.goHome}
          />
        )}
        {viewState === 'game' && <GameView key="game" game={game} />}
        {viewState === 'result' && <ResultView key="result" game={game} backToHistory={backToHistory} />}
        {viewState === 'history' && (
          <HistoryView
            key="history"
            historyList={history.list}
            syncState={history.syncState}
            syncMessage={history.syncMessage}
            pendingCount={history.pendingCount}
            lastSyncedAt={history.lastSyncedAt}
            chart={chart}
            exportTool={exportTool}
            lowAccuracyCount={lowAccuracyCount}
            viewHistoryDetail={viewHistoryDetail}
            clearLowAccuracy={clearLowAccuracy}
            clearPartial={clearPartial}
            clearHistory={clearHistory}
            retrySync={() => void history.refreshRemote({ force: true }).then(chart.reopenIfActive)}
            closeHistory={() => setViewState('home')}
          />
        )}
        {viewState === 'cubic' && <CubicView key="cubic" three={three} />}
      </AnimatePresence>

      <AnimatePresence>
        {toast.show ? (
          <motion.div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center px-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="rounded-full bg-black/80 px-5 py-3 text-[15px] font-semibold text-white shadow-lift">{toast.title}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
    </dailyTagContext.Provider>
  );
}
