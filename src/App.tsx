import { AnimatePresence, motion } from 'framer-motion';
import { IconPencil } from '@tabler/icons-react';
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
import { useMemo, useState } from 'react';
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

const groupTitleTone = (groupKey: string) =>
  groupKey === 'divSelect' || groupKey === 'bigNineDivSelect'
    ? 'group-title-special'
    : 'group-title-mental';

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

function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-[14px] shrink-0 rounded-[18px] border-[0.5px] border-[#ECE4E7] bg-white px-5 py-[18px]">
      <div className="inline-flex items-center gap-[3px] rounded-[20px] bg-[#F7EDF0] px-[13px] py-[5px] text-[11px] font-medium leading-none text-[#B5879A]">
        <IconPencil size={12} stroke={1.8} />
        <span>浠婃棩缁冧範</span>
      </div>
      <h1 className="mt-[10px] text-[23px] font-medium leading-tight tracking-[-0.3px] text-[#4A3E44]">{title}</h1>
      {subtitle ? <p className="mt-1 text-[12px] leading-5 text-[#A892A0]">{subtitle}</p> : null}
      <div className="mt-3 flex items-center gap-[5px]">
        <span className="h-1 w-6 rounded-sm bg-[#D9A7B8]" />
        <span className="h-1 w-[10px] rounded-sm bg-[#E8C9D3]" />
        <span className="h-1 w-[10px] rounded-sm bg-[#DCE6EC]" />
      </div>
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
      <PageHeader title="计算助手" subtitle="每天一点点,心算更轻松" />
      <div className="grid min-h-0 flex-1 gap-[10px]">
        <div className="surface flex min-h-0 flex-col rounded-xl p-[14px]">
          <div className="scroll-clean min-h-0 flex-1 pr-1">
            {Object.entries(MODE_GROUPS).map(([groupKey, group]) => (
              <section key={groupKey} className="mb-5">
                <div className={cn('mb-2 px-1 text-[13px] font-semibold', groupTitleTone(groupKey))}>{GROUP_LABELS[groupKey] || group.label}</div>
                {groupKey === 'divSelect' ? (
                  <Button variant="secondary" className="tone-special w-full" onClick={toSelectDivisor}>
                    商首位除数选择 <ChevronLeft className="h-4 w-4 rotate-180" />
                  </Button>
                ) : groupKey === 'bigNineDivSelect' ? (
                  <Button variant="secondary" className="tone-special w-full" onClick={toSelectBigNineDivisor}>
                    大九九除法专项 <ChevronLeft className="h-4 w-4 rotate-180" />
                  </Button>
                ) : (
                  <div className="grid grid-cols-2 gap-[10px] sm:grid-cols-3">
                    {group.modes.map((modeKey) => (
                      <button
                        key={modeKey}
                        className={cn(
                          'flex min-h-[60px] items-center justify-center rounded-lg px-3 text-center text-[15px] font-semibold transition active:scale-[0.99]',
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
            <section className="mb-5">
              <div className="group-title-space mb-2 px-1 text-[13px] font-semibold">空间思维</div>
              <div className="grid grid-cols-2 gap-[10px]">
                <button
                  className="tone-space flex min-h-[60px] items-center justify-center gap-2 rounded-lg px-3 text-center text-[15px] font-semibold transition active:scale-[0.99]"
                  onClick={() => startCubicMode('block')}
                >
                  <Box className="h-5 w-5" /> 立体拼合
                </button>
                <button
                  className="tone-space flex min-h-[60px] items-center justify-center gap-2 rounded-lg px-3 text-center text-[15px] font-semibold transition active:scale-[0.99]"
                  onClick={() => startCubicMode('section')}
                >
                  <Layers3 className="h-5 w-5" /> 立体截面
                </button>
              </div>
            </section>
          </div>
          <div className="mt-[10px] grid shrink-0 gap-[10px] border-t border-black/[0.06] pt-[14px] sm:grid-cols-2">
            <Button className="h-14 text-[17px]" onClick={startGame}>
              开始练习
            </Button>
            <Button variant="secondary" className="h-14 text-[17px]" onClick={openHistory}>
              <History className="h-5 w-5" /> 历史记录
            </Button>
          </div>
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
        <div className="text-[24px] text-muted">梅</div>
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

  if (['pairMult', 'decompAdd'].includes(currentModeKey)) {
    const labels = currentModeKey === 'pairMult' ? ['左边', '右边'] : ['十位和', '个位和', '总和'];
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

  return (
    <Screen className="gap-[10px]">
      <div className="flex shrink-0 items-center gap-[10px]">
        <Button variant="secondary" className="h-11 px-4" onClick={game.goHome}>
          <ChevronLeft className="h-5 w-5" /> 返回
        </Button>
        <div className="ml-auto flex items-center gap-[10px]">
          <div className="rounded-md bg-accentSoft px-3 py-2 text-center text-[14px] font-semibold text-accentDeep">{game.progressText}</div>
          <div className="rounded-md bg-accentSoft px-3 py-2 text-center text-[14px] font-semibold text-accentDeep">
            <Clock3 className="mr-1 inline h-4 w-4" />{game.totalText}
          </div>
        </div>
      </div>

      <div className="surface flex min-h-0 flex-1 flex-col justify-center rounded-xl p-[14px] text-center">
        <div className={cn('font-semibold tracking-normal text-ink', game.isSmallFont ? 'text-[46px]' : 'text-[64px] md:text-[84px]')}>
          {prettyExpression(game.qText)}
        </div>
        <div className="mx-auto mt-2 max-w-[520px] text-[15px] leading-6 text-muted">
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
            <button className="tone-number h-[120px] rounded-lg text-center text-[44px] font-semibold" onClick={() => game.pressDigit(game.currentModeKey === 'borrowJudge' ? '-1' : '1')}>
              {game.currentModeKey === 'borrowJudge' ? '退位' : '进位'}
              <span className="block text-[14px] text-muted">{game.currentModeKey === 'borrowJudge' ? '退位' : '进位'}</span>
            </button>
            <button className="tone-number h-[120px] rounded-lg text-center text-[44px] font-semibold" onClick={() => game.pressDigit('0')}>
              0<span className="block text-[14px] text-muted">不变</span>
            </button>
            <Button className="col-span-2 h-14" onClick={game.confirmAnswer}>确认</Button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-[10px]">
            {digits.map((item) => (
              <button key={item} className="tone-number h-[64px] rounded-lg text-center text-[28px] font-semibold active:scale-[0.99]" onClick={() => game.pressDigit(item)}>
                {item}
              </button>
            ))}
            <button className="tone-number h-[64px] rounded-lg text-center text-[28px] font-semibold active:scale-[0.99]" onClick={game.pressDot}>.</button>
            <button className="tone-number h-[64px] rounded-lg text-center text-[28px] font-semibold active:scale-[0.99]" onClick={() => game.pressDigit(0)}>0</button>
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
                  {item.usedStr}{!isResult ? ` 路 閿?${item.wrong}${item.skipped ? ' 路 璺宠繃' : ''}` : item.detailTimes ? ` 路 ${item.detailTimes}` : ''}
                </div>
              </div>
              {isResult ? (
                <div className={cn('rounded-md px-2 py-1 text-right text-[14px] font-semibold', item.ok ? 'semantic-success' : 'semantic-error')}>
                  {item.ok ? '正确' : `答案 ${prettyExpression(item.realAns)}`}
                  {item.exactAns ? <div className="mt-1 text-[11px] text-muted">准 {item.exactAns} · 误 {item.errorRate}</div> : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="mt-[10px] grid gap-[10px] sm:grid-cols-2">
        {game.isHistoryReview ? (
          <Button className="h-14 sm:col-span-2" onClick={backToHistory}>返回列表</Button>
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

function HistoryView({
  historyList,
  syncState,
  syncMessage,
  chart,
  exportTool,
  lowAccuracyCount,
  viewHistoryDetail,
  clearLowAccuracy,
  clearOldest,
  clearHistory,
  closeHistory,
}: {
  historyList: HistoryRecord[];
  syncState: 'idle' | 'syncing' | 'ok' | 'error';
  syncMessage: string;
  chart: ReturnType<typeof useChart>;
  exportTool: ReturnType<typeof useExportTool>;
  lowAccuracyCount: number;
  viewHistoryDetail: (index: number) => void;
  clearLowAccuracy: () => void;
  clearOldest: () => void;
  clearHistory: () => void;
  closeHistory: () => void;
}) {
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
          <div className="mt-[10px] rounded-xl bg-[#F4F7F8] p-[14px] hairline">
            <div className="scroll-clean mb-[10px] flex gap-[10px] overflow-x-auto">
              {chart.availableModes.map((mode) => (
                <button key={mode} className={cn('rounded-md px-3 py-2 text-[13px] font-semibold', chart.chartTab === mode ? 'selected-control' : 'premium-control')} onClick={() => chart.switchChartTab(mode)}>
                  {prettyExpression(mode)}
                </button>
              ))}
            </div>
            <div id="accChart" className="h-[220px] w-full" />
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

        <div className="mt-4 flex shrink-0 justify-between px-1 text-[13px] font-semibold text-muted">
          <span>时间 / 模式</span><span>成绩 / 耗时</span>
        </div>
        {syncState === 'syncing' ? <div className="px-1 pt-2 text-[12px] text-muted">正在同步云端记录...</div> : null}
        {syncState === 'error' ? <div className="px-1 pt-2 text-[12px] text-red-600">云端同步失败：{syncMessage}</div> : null}
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
        <div className="mt-[10px] grid shrink-0 gap-[10px] sm:grid-cols-2">
          {lowAccuracyCount > 0 ? <Button variant="ghost" onClick={clearLowAccuracy}>清理低正确率 {lowAccuracyCount} 条</Button> : null}
          {historyList.length > 1000 ? <Button variant="danger" onClick={clearOldest}>清理最早 1000 条</Button> : null}
          <Button variant="danger" onClick={clearHistory}><Trash2 className="h-5 w-5" /> 清空全部</Button>
          <Button onClick={closeHistory}>返回主页</Button>
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
  const clearOldest = () => {
    if (!confirm(`当前共有 ${history.list.length} 条记录。\n确定清理最早的 1000 条吗？`)) return;
    void history.clearOldest(1000);
    showToast('清理成功');
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
    if (!confirm('确定清空全部历史记录吗？此操作不可恢复。')) return;
    void history.clearAll();
    showToast('已清空');
  };

  return (
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
            chart={chart}
            exportTool={exportTool}
            lowAccuracyCount={lowAccuracyCount}
            viewHistoryDetail={viewHistoryDetail}
            clearLowAccuracy={clearLowAccuracy}
            clearOldest={clearOldest}
            clearHistory={clearHistory}
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
  );
}
