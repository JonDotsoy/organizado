export interface CreatedProject {
  timestamp: number;
}

export interface StartTrack {
  taskId: number
  timestamp: number
}

export interface StopTrack {
  taskId: number
  timestamp: number
}

export interface TaskComment {
  taskId: number
  timestamp: number
  comment: string
}

export type ProjectEvent =
  | { CreatedProject: CreatedProject; }
  | { StartTrack: StartTrack }
  | { StopTrack: StopTrack }
  | { TaskComment: TaskComment }
