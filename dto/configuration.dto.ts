import { ProjectDetail } from "./project-detail.dto.ts";

export interface Configuration {
  project_selected?: string;
  projects?: ProjectDetail[];
}
