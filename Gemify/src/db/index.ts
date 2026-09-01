export { getDatabase, initDatabase } from "./database";

// Backup (export / import the whole database as one JSON file)
export { exportBackup, pickAndImportBackup } from "./backup";
export type { ImportSummary } from "./backup";

// Dreams & feeling states
export {
  createDream,
  deleteDream,
  getDreamById,
  getDreams,
  getDreamSummaries,
  getFeelingStates,
  getWeekAscent,
  updateDream,
} from "./dreamsRepository";
export type { DreamSummary, WeekAscentEntry } from "./dreamsRepository";

// Milestones
export {
  deleteMilestone,
  getMilestoneById,
  getMilestones,
  getQuestProgressByMilestone,
  insertMilestone,
  updateMilestone,
} from "./milestonesRepository";
export type { MilestoneQuestProgress } from "./milestonesRepository";

// Quests & ideas
export {
  approveIdea,
  createIdea,
  createQuest,
  deleteQuest,
  getIdeas,
  getQuestById,
  getQuests,
  getQuestsByDream,
  getSchedulableQuests,
  getScheduledQuestCounts,
  getScheduledQuests,
  getUnscheduledQuests,
  rolloverOverdueQuests,
  setQuestDone,
  updateQuest,
} from "./questsRepository";

// Habits
export {
  createHabit,
  deleteHabit,
  getHabitById,
  getHabitCompletions,
  getHabitDetailChecks,
  getHabitDetails,
  getHabitDoneCount,
  getHabitScheduleDays,
  getHabits,
  getHabitsByDream,
  setHabitCompletion,
  setHabitDetailCheck,
  setHabitDetails,
  setHabitScheduleDays,
  updateHabit,
} from "./habitsRepository";

// Daily routine time blocks
export {
  createTimeBlock,
  deleteTimeBlock,
  getCurrentBlockKey,
  getTimeBlocks,
  updateTimeBlock,
} from "./timeBlocksRepository";
export type { NewTimeBlock, TimeBlockPatch } from "./timeBlocksRepository";

// Risks (What-If plans)
export {
  createRisk,
  deleteRisk,
  getRisks,
  setRiskActions,
  updateRisk,
} from "./risksRepository";

// Timeline moments
export {
  addTimelineMoment,
  deleteTimelineMoment,
  getTimelineMoments,
  updateTimelineMoment,
} from "./timelineRepository";

export type {
  Dream,
  DreamPatch,
  FeelingState,
  Habit,
  HabitCompletionRecord,
  HabitCompletionStatus,
  HabitDetailEntry,
  HabitDetailSection,
  HabitPatch,
  HabitTimeOfDay,
  Idea,
  Milestone,
  MilestonePatch,
  MilestoneStatus,
  NewDream,
  NewHabit,
  NewMilestone,
  NewRisk,
  NewTimelineMoment,
  Quest,
  QuestPatch,
  QuestWithBreadcrumb,
  Risk,
  RiskAction,
  TimeBlockIcon,
  TimeBlockRecord,
  TimelineMoment,
  TimelineMomentPatch,
} from "./types";
