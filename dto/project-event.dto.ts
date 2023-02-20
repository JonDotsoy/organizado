import { Event } from "./event.dto.ts";

interface UpdateTitle {
  title: string;
}

interface CreateTask {
  taskId: string;
}

interface RelatedLink {
  url: URL;
}

interface RelatedGit {
  git: URL;
}

export type ProjectEvent = Event<
  {
    Created: true;
    UpdateTitle: UpdateTitle;
    CreateTask: CreateTask;
    RelatedLink: RelatedLink;
    RelatedGit: RelatedGit;
  }
>;
