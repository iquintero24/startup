import "../css/style.css";

type Task = {
  id: string;
  title: string;
  description: string;
  state: "todo" | "in_progrees" | "done";
};

type TaskStructure = {
  todo: Task[];
  in_progrees: Task[];
  done: Task[];
};

let Tasks: TaskStructure = {
  todo: [],
  in_progrees: [],
  done: [],
};


function generateId():string{
    return Math.random().toString(36).substring(2,10)
}

function createCard(task: Task): HTMLElement{
    const card = document.createElement('div')
    card.className = "bg-neutral-700 p-3 rounded text-white shadow-md"
    card.textContent = task.title;
    card.setAttribute("data-id", task.id);
    return card
}

function renderInitialTasks(){
    Tasks.todo.forEach((task)=>{
        const column = document.getElementById("todo-list")
        if (column) {
            const card = createCard(task)
            column.appendChild(card)
        }
    })
    
};

function setupInput(inputId: string, listId: string){
    const input = document.getElementById(inputId) as HTMLInputElement;
    const list = document.getElementById(listId)!;

    input.addEventListener("keydown", (e)=>{
        if (e.key === "Enter" && input.value.trim() !== "") {
            const newTask: Task = {
                id: generateId(),
                title: input.value.trim(),
                description: "",
                state: "todo"
            };

            Tasks.todo.push(newTask);

            const card = createCard(newTask);
            list.appendChild(card)

            input.remove();
            
        }
    })
}

renderInitialTasks()

setupInput("todo-input", "todo-list");
setupInput("progress-input", "progress-list");
setupInput("done-input","done-list")