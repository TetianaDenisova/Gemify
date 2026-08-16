export { getDatabase, initDatabase, resetDatabaseForDev } from "./database";

// Items (v1 demo slice)
export {
  createItem,
  deleteItem,
  getItemById,
  getItems,
  updateItem,
} from "./itemsRepository";

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
  setDreamFeelingStates,
  updateDream,
} from "./dreamsRepository";
export type { DreamSummary } from "./dreamsRepository";

// Milestones
export {
  deleteMilestone,
  getMilestoneById,
  getMilestones,
  insertMilestone,
  updateMilestone,
} from "./milestonesRepository";

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
  updateQuest,
} from "./questsRepository";

// Tasks
export {
  createTask,
  deleteTask,
  getScheduledTaskCounts,
  getScheduledTasks,
  getTaskById,
  getTasksByDream,
  getTasksByQuest,
  getUnscheduledTasks,
  setTaskDone,
  updateTask,
} from "./tasksRepository";

// Habits
export {
  createHabit,
  deleteHabit,
  getHabitById,
  getHabitCompletions,
  getHabitDetails,
  getHabitDoneCount,
  getHabitScheduleDays,
  getHabits,
  getHabitsByDream,
  setHabitCompletion,
  setHabitDetails,
  setHabitScheduleDays,
  updateHabit,
} from "./habitsRepository";

// Daily routine time blocks
export {
  getCurrentBlockKey,
  getDayProgress,
  getTimeBlocksForDate,
  setActionDone,
} from "./timeBlocksRepository";

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
  Item,
  ItemPatch,
  Milestone,
  MilestonePatch,
  MilestoneStatus,
  NewDream,
  NewHabit,
  NewItem,
  NewMilestone,
  NewRisk,
  NewTask,
  NewTimelineMoment,
  Quest,
  Risk,
  RiskAction,
  Task,
  TaskPatch,
  TaskWithBreadcrumb,
  TimeBlockActionRecord,
  TimeBlockRecord,
  TimeBlockWithActions,
  TimelineMoment,
} from "./types";
