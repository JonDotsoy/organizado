import { Event } from "./event.dto.ts";

export interface UpdateTitle {
  title: string;
}

export interface CreateComment {
  id: string;
  comment: string;
}

export interface RelatedTask {
  taskRelated: string;
}

export type TaskEvent = Event<{
  Created: true;
  UpdateTitle: UpdateTitle;
  CreateComment: CreateComment;
  RelatedTask: RelatedTask;
}>;
