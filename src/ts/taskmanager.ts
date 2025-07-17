export type Task = {
  id: string;
  title: string;
  description: string;
  state: "todo" | "in_progress" | "done";
};

export type TasksStructure = {
  todo: Task[];
  in_progress: Task[];
  done: Task[];
};

let tasks: TasksStructure = JSON.parse(localStorage.getItem("tasks") || '{"todo":[],"in_progress":[],"done":[]}');

function saveTasksToLocalStorage() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function createCard(task: Task): HTMLElement {
  const card = document.createElement("div");
  card.className = "bg-neutral-700 p-3 rounded text-white shadow-md";
  card.textContent = task.title;
  card.setAttribute("data-id", task.id);
  card.setAttribute("draggable", "true");

  card.addEventListener("dragstart", (e) => {
    e.dataTransfer?.setData("text/plain", task.id);
  });

  return card;
}

function createInput(list: HTMLElement, inputId: string, state: keyof TasksStructure): HTMLInputElement {
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Escribe una tarea...";
  input.className = "mt-2 p-2 rounded text-black";
  input.id = inputId;

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && input.value.trim() !== "") {
      const newTask: Task = {
        id: generateId(),
        title: input.value.trim(),
        description: "",
        state: state, // ← ahora toma el estado correcto
      };

      tasks[state].push(newTask);
      saveTasksToLocalStorage();

      const card = createCard(newTask);
      list.replaceChild(card, input);

      const newInput = createInput(list, inputId, state);
      list.appendChild(newInput);
    }
  });

  setTimeout(() => input.focus(), 0);
  return input;
}

function renderInitialTasks(list: HTMLElement, inputId: string, state: keyof TasksStructure) {
  tasks[state].forEach((task) => {
    const card = createCard(task);
    list.appendChild(card);
  });

  const input = createInput(list, inputId, state);
  list.appendChild(input);
}

export function setupTaskColumn(listId: string, inputId: string, state: keyof TasksStructure) {
  const list = document.getElementById(listId);
  if (!list) return;
 
  renderInitialTasks(list, inputId, state);
  setupDropZone(list, state);
  
}

function setupDropZone(list: HTMLElement, state: keyof TasksStructure) {
  list.addEventListener("dragover", (e) => {
    e.preventDefault();
  });

  list.addEventListener("drop", (e) => {
    e.preventDefault();
    const taskId = e.dataTransfer?.getData("text/plain");
    if (!taskId) return;

    // Encuentra y mueve la tarjeta al nuevo estado
    let movedTask: Task | undefined;
    for (const key of Object.keys(tasks) as (keyof TasksStructure)[]) {
      const index = tasks[key].findIndex((t) => t.id === taskId);
      if (index !== -1) {
        movedTask = tasks[key].splice(index, 1)[0];
        break;
      }
    }

    if (movedTask) {
      movedTask.state = state;
      tasks[state].push(movedTask);
      saveTasksToLocalStorage();

      // Remover la tarjeta del DOM anterior si existía
      const existingCard = document.querySelector(`[data-id="${movedTask.id}"]`);
      if (existingCard) existingCard.remove();

      // Agregarla a la nueva columna
      const newCard = createCard(movedTask);
      // Insertar antes del input
      const input = list.querySelector("input");
      list.insertBefore(newCard, input || null);
    }
  });
}
