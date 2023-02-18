import { Event } from "./event.dto.ts";

interface UpdateTitle {
  title: string;
}

interface CreateTask {
  taskId: string;
}

export type ProjectEvent = Event<
  {
    Created: true;
    UpdateTitle: UpdateTitle;
    CreateTask: CreateTask;
  }
>;
