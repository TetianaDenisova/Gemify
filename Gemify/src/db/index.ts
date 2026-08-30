export { getDatabase, initDatabase, resetDatabaseForDev } from "./database";

// Backup (export / import the whole database as one JSON file)
export { exportBackup, pickAndImportBackup } from "./backup";
export type { ImportSummary } from "./backup";

// Settings
export {
  SETTING_KEYS,
  deleteSetting,
  getSetting,
  setSetting,
} from "./settingsRepository";

// Dreams & feeling states
export {
  createDream,
  deleteDream,
  getDreamById,
  getDreamFeelingStates,
  getDreams,
  getDreamSummaries,
  getFeelingStates,
  getWeekAscent,
  setDreamFeelingStates,
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
  deleteIdea,
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
  getDayProgress,
  getTimeBlocks,
  getTimeBlocksForDate,
  setActionDone,
  updateTimeBlock,
} from "./timeBlocksRepository";
export type { NewTimeBlock, TimeBlockPatch } from "./timeBlocksRepository";

// Risks (What-If plans)
export {
  createRisk,
  deleteRisk,
  getRiskById,
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
  TimeBlockActionRecord,
  TimeBlockRecord,
  TimeBlockWithActions,
  TimelineMoment,
  TimelineMomentPatch,
} from "./types";
