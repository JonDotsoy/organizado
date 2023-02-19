import { Event } from "./event.dto.ts";

export interface UpdateTitle {
  title: string;
}

export interface CreateComment {
  id: string;
  comment: string;
}

export interface EditComment {
  id: string;
  comment: string;
}

export interface DeleteComment {
  id: string;
}

export interface RelatedTask {
  taskRelated: string;
}

export interface StartTimer {
  startTimer: number;
}

export interface StopTimer {
  stopTimer: number;
}

export type TaskEvent = Event<{
  Created: true;
  Archived: true;
  UpdateTitle: UpdateTitle;
  CreateComment: CreateComment;
  EditComment: EditComment;
  DeleteComment: DeleteComment;
  RelatedTask: RelatedTask;
  StartTimer: StartTimer;
  StopTimer: StopTimer;
}>;
