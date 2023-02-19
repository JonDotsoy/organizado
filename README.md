# Organizado

Project to order your tasks with your terminal.

## How to install

Install with Deno

```sh
deno install \
  -f \
  -r \
  --allow-env=HOME \
  --allow-read=$HOME/.organizado/ \
  --allow-write=$HOME/.organizado/ \
  --unstable \
  --import-map https://deno.land/x/organizado/import_map.json \
  https://deno.land/x/organizado/cli.ts
```

## Commands

- Create a new project:
  - `$ organizado project new <project_name> <path_location>`
- About project selected
  - `$ organizado project`
- Edit a project:
  - `$ organizado project edit <>`
- Select a project
  - `$ organizado project select <project_name>`
- Create new task:
  - `$ organizado task new -m <task_message>`
- Display a all tasks
  - `$ organizado task`
- Focus on one task: display the current task and start one timer
  - `$ organizado task focus`
- Inside on a task:
  - Key press `<P>` to pause the task or resume the task timer
  - Key press `<Q>` to stop the task
  - Key press `<X>` to mark as finish the task
  - Key press `<M>` create a comment on this task
  - Key press `<C>` create a new task related with the current task
