import { TimeBlock } from '../types';

export function timeStringToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTimeString(totalMinutes: number): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function formatTimeDisplay(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
}

export interface DayProgressInfo {
  nowBlock: TimeBlock | null;
  nextBlock: TimeBlock | null;
  remainingBlocks: TimeBlock[];
  minutesRemainingInNow: number;
  totalBlocksToday: number;
  completedBlocksCount: number;
  progressPercentage: number;
}

export function calculateDayProgress(blocks: TimeBlock[], now: Date = new Date()): DayProgressInfo {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  let nowBlock: TimeBlock | null = null;
  let nextBlock: TimeBlock | null = null;
  const remainingBlocks: TimeBlock[] = [];
  let completedCount = 0;

  // Sort chronologically
  const sorted = [...blocks].sort((a, b) => timeStringToMinutes(a.startTime) - timeStringToMinutes(b.startTime));

  for (const block of sorted) {
    const startMin = timeStringToMinutes(block.startTime);
    const endMin = timeStringToMinutes(block.endTime);

    if (block.status === 'done') {
      completedCount++;
    }

    // Check if this is current block
    if (currentMinutes >= startMin && currentMinutes < endMin && block.status !== 'done' && block.status !== 'skipped') {
      nowBlock = block;
    } else if (startMin > currentMinutes && !nextBlock && block.status !== 'done' && block.status !== 'skipped') {
      nextBlock = block;
      remainingBlocks.push(block);
    } else if (startMin > currentMinutes) {
      remainingBlocks.push(block);
    }
  }

  // If no active block, pick next as priority
  let minutesRemainingInNow = 0;
  if (nowBlock) {
    const endMin = timeStringToMinutes(nowBlock.endTime);
    minutesRemainingInNow = Math.max(0, endMin - currentMinutes);
  }

  const totalBlocks = sorted.length;
  const progressPercentage = totalBlocks > 0 
    ? Math.round((completedCount / totalBlocks) * 100) 
    : 0;

  return {
    nowBlock,
    nextBlock,
    remainingBlocks,
    minutesRemainingInNow,
    totalBlocksToday: totalBlocks,
    completedBlocksCount: completedCount,
    progressPercentage,
  };
}

export function detectConflicts(blocks: TimeBlock[]): Set<string> {
  const conflictingIds = new Set<string>();
  const sorted = [...blocks].sort((a, b) => timeStringToMinutes(a.startTime) - timeStringToMinutes(b.startTime));

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];

    const currentEnd = timeStringToMinutes(current.endTime);
    const nextStart = timeStringToMinutes(next.startTime);

    if (currentEnd > nextStart) {
      conflictingIds.add(current.id);
      conflictingIds.add(next.id);
    }
  }

  return conflictingIds;
}

export function quickSnoozeBlock(block: TimeBlock, snoozeMinutes: number = 10): TimeBlock {
  const startM = timeStringToMinutes(block.startTime);
  const endM = timeStringToMinutes(block.endTime);

  const newStart = minutesToTimeString(startM + snoozeMinutes);
  const newEnd = minutesToTimeString(endM + snoozeMinutes);

  return {
    ...block,
    startTime: newStart,
    endTime: newEnd,
  };
}
