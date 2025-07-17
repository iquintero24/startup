import "../css/style.css";

// src/main.ts

import { setupTaskColumn } from "./taskmanager";


setupTaskColumn("todo-list", "todo-input", "todo");
setupTaskColumn("progress-list", "progress-input", "in_progress");
setupTaskColumn("done-list", "done-input", "done");