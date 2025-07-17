// ====================
// Tipos y estructura
// ====================

/**
 * Representa una tarea individual.
 */
export type Task = {
  id: string;                           // Identificador único generado al crear la tarea
  title: string;                        // Título o nombre de la tarea
  description: string;                  // Descripción detallada
  performed: "nothing" | "created" | "updated" | "deleted";  // Estado del cambio (para control futuro)
};

/**
 * Estructura principal del tablero con listas de tareas según su estado.
 */
export type TasksStructure = {
  todo: Task[];           // Tareas por hacer
  in_progress: Task[];    // Tareas en progreso
  done: Task[];           // Tareas completadas
};

// ====================
// Datos iniciales
// ====================

/**
 * Se cargan las tareas desde localStorage si existen, de lo contrario se inicializa con listas vacías.
 */
let tasks: TasksStructure = JSON.parse(
  localStorage.getItem("tasks") || '{"todo":[],"in_progress":[],"done":[]}'
);

// ====================
// Utilidades generales
// ====================

/**
 * Guarda el objeto completo de tareas en localStorage.
 */
function saveTasksToLocalStorage() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

/**
 * Genera un ID aleatorio único para una nueva tarea.
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

// ====================
// UI: Creación de tarjeta visual (card)
// ====================

/**
 * Genera el elemento visual de una tarea para ser insertado en el DOM.
 * Incluye título, descripción, funcionalidad drag-and-drop y click para editar.
 */
function createCard(task: Task): HTMLElement {
  const card = document.createElement("div");
  card.className = "bg-neutral-700 p-3 rounded text-white shadow-md cursor-pointer w-full";
  card.setAttribute("data-id", task.id);
  card.setAttribute("draggable", "true");

  const title = document.createElement("div");
  title.className = "font-bold break-words";
  title.textContent = task.title;

  const description = document.createElement("div");
  description.className = "text-sm opacity-70 whitespace-pre-line break-words";
  description.textContent = task.description;

  card.appendChild(title);
  card.appendChild(description);

  // Arrastrar tarjeta
  card.addEventListener("dragstart", (e) => {
    e.dataTransfer?.setData("text/plain", task.id);
  });

  // Hacer clic para editar la tarjeta
  card.addEventListener("click", () => {
    const editForm = createEditForm(task);
    card.replaceWith(editForm);
  });

  return card;
}

/**
 * Crea un <textarea> que se autoajusta verticalmente al escribir.
 */
function createAutoGrowingTextarea(value: string = ""): HTMLTextAreaElement {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.className = "p-2 rounded text-black resize-none overflow-hidden w-full bg-white focus:outline-purple-500";
  textarea.rows = 1;
  textarea.style.height = "auto";

  // Ajustar el alto dinámicamente mientras se escribe
  textarea.addEventListener("input", () => {
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  });

  // Ajuste inicial tras render
  setTimeout(() => {
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, 0);

  return textarea;
}

// ====================
// UI: Creación de formulario para nueva tarea
// ====================

/**
 * Renderiza los inputs para crear una nueva tarea.
 */
function createInput(list: HTMLElement, inputId: string, state: keyof TasksStructure): HTMLElement {
  const container = document.createElement("div");
  container.className = "flex flex-col gap-2 mt-2";
  container.id = inputId;

  const titleInput = document.createElement("input");
  titleInput.type = "text";
  titleInput.placeholder = "Título de la tarea";
  titleInput.className = "p-2 rounded text-black w-full";

  const descriptionInput = createAutoGrowingTextarea();
  descriptionInput.placeholder = "Descripción de la tarea";

  // Función que crea la tarjeta y la guarda
  const handleSubmit = () => {
    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();
    if (title === "") return;

    const newTask: Task = {
      id: generateId(),
      title,
      description,
      performed: "nothing", // Marca como nueva (sin cambios posteriores aún)
    };

    tasks[state].push(newTask);
    saveTasksToLocalStorage();

    const card = createCard(newTask);
    list.replaceChild(card, container);

    const newInput = createInput(list, inputId, state);
    list.appendChild(newInput);
  };

  // Eventos de teclado para confirmar tarea
  titleInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") descriptionInput.focus();
  });

  descriptionInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleSubmit();
  });

  container.appendChild(titleInput);
  container.appendChild(descriptionInput);
  setTimeout(() => titleInput.focus(), 0);

  return container;
}

// ====================
// UI: Formulario de edición
// ====================

/**
 * Crea un formulario de edición cuando el usuario hace clic en una tarjeta.
 */
function createEditForm(task: Task): HTMLElement {
  const container = document.createElement("div");
  container.className = "bg-neutral-700 p-3 rounded text-white shadow-md flex flex-col gap-2 w-full";

  const titleInput = document.createElement("input");
  titleInput.value = task.title;
  titleInput.className = "p-2 rounded text-black";

  const descriptionInput = createAutoGrowingTextarea(task.description);

  // Guardar los cambios y volver a mostrar como tarjeta
  const save = () => {
    task.title = titleInput.value.trim();
    task.description = descriptionInput.value.trim();
    task.performed = "updated";
    saveTasksToLocalStorage();

    const updatedCard = createCard(task);
    container.replaceWith(updatedCard);
  };

  // Eventos Enter para cambiar de input o guardar
  titleInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") descriptionInput.focus();
  });

  descriptionInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") save();
  });

  container.appendChild(titleInput);
  container.appendChild(descriptionInput);
  setTimeout(() => titleInput.focus(), 0);

  return container;
}

// ====================
// Drag and drop entre columnas
// ====================

/**
 * Configura una zona para permitir soltar tarjetas (dropzone).
 */
function setupDropZone(list: HTMLElement, state: keyof TasksStructure) {
  list.addEventListener("dragover", (e) => {
    e.preventDefault(); // Necesario para permitir el drop
  });

  list.addEventListener("drop", (e) => {
    e.preventDefault();
    const taskId = e.dataTransfer?.getData("text/plain");
    if (!taskId) return;

    let movedTask: Task | undefined;

    // Buscar y eliminar la tarea desde su lista original
    for (const key of Object.keys(tasks) as (keyof TasksStructure)[]) {
      const index = tasks[key].findIndex((t) => t.id === taskId);
      if (index !== -1) {
        movedTask = tasks[key].splice(index, 1)[0];
        break;
      }
    }

    if (movedTask) {
      movedTask.performed = "updated";
      tasks[state].push(movedTask);
      saveTasksToLocalStorage();

      // Remover visualmente si aún estaba visible
      const existingCard = document.querySelector(`[data-id="${movedTask.id}"]`);
      if (existingCard) existingCard.remove();

      const newCard = createCard(movedTask);
      const input = list.querySelector("div[id$='-input']");
      list.insertBefore(newCard, input || null);
    }
  });
}

// ====================
// Render inicial
// ====================

/**
 * Carga todas las tareas guardadas y renderiza sus tarjetas en pantalla.
 */
function renderInitialTasks(list: HTMLElement, inputId: string, state: keyof TasksStructure) {
  tasks[state].forEach((task) => {
    const card = createCard(task);
    list.appendChild(card);
  });

  const input = createInput(list, inputId, state);
  list.appendChild(input);
}

/**
 * Punto de entrada para inicializar una columna de tareas.
 * @param listId - ID del contenedor HTML
 * @param inputId - ID para el input de nuevas tareas
 * @param state - Estado de la columna ("todo", "in_progress", "done")
 */
export function setupTaskColumn(listId: string, inputId: string, state: keyof TasksStructure) {
  const list = document.getElementById(listId);
  if (!list) return;

  renderInitialTasks(list, inputId, state);
  setupDropZone(list, state);
}
