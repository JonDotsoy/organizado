import { TaskDetail } from "./task-detail.dto.ts";

export interface ProjectDetail {
  id: string;
  title: string | null;
  location: string;
  tasks: TaskDetail[]
}
