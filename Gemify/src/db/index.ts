export { getDatabase, initDatabase } from "./database";

// Backup (export / import the whole database as one JSON file)
export { exportBackup, pickAndImportBackup } from "./backup";
export type { ImportSummary } from "./backup";

// Dreams & feeling states
export {
  createDream,
  deleteDream,
  getArchivedDreams,
  getCompletedDreams,
  getDreamById,
  getDreams,
  getDreamsWithCompleted,
  getDreamSummaries,
  getFeelingStates,
  getWeekAscent,
  updateDream,
} from "./dreamsRepository";
export type { DreamSummary, WeekAscentEntry } from "./dreamsRepository";

// Settings (device-local key/value: "seen today" flags and the like)
export { getSetting, setSetting } from "./settingsRepository";

// Forecast cache (device-local: the completion date the banner last showed)
export {
  getForecastProjection,
  saveForecastProjection,
} from "./forecastCacheRepository";

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

// Rewards earned by completing milestones
export {
  collectReward,
  completeMilestone,
  getRewardsByDream,
  getUnseenRewardCount,
  markAllRewardsSeen,
  subscribeToRewardCountChanges,
} from "./rewardsRepository";

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
  getQuestsForActiveDreams,
  getSchedulableQuests,
  getScheduledQuestCounts,
  getScheduledQuests,
  getUnscheduledQuests,
  getOverdueQuests,
  rescheduleQuests,
  rolloverOverdueQuests,
  setQuestDone,
  updateQuest,
} from "./questsRepository";

// Habits
export {
  createHabit,
  deleteHabit,
  getCompletedHabits,
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
  DEFAULT_TIME_BLOCKS,
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
  MilestoneReward,
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
