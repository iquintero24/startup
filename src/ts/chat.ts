import OpenAI from "openai"
import { API_KEY } from "./config"
import type { TasksStructure } from "./taskmanager";

type SystemResponse = {
  tasks: TasksStructure,
  response: string
}

const client = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: API_KEY,
  dangerouslyAllowBrowser: true
});

const SYSTEM_PROMPT = "You are a task manager assistant, you help people to organize, create, update, and delete their tasks, you recive the user request in the following json_format: \"{\"tasks\":{\"todo\":[{\"id\":\"\",\"title\":\"Example...\",\"desciption\":\"Lorem...\",\"performed\":\"nothing\"}],\"in_progress\":[],\"done\":[]},\"request\":\"User request\"}\". You must response with the following json format (the task \"performed\" field must be once of the following, it represents what you performed on the task \"created\" means that you have created the task, \"updated\" mean that you change the task from board (todo, in progress, done), \"deleted\" that mean that is removed \"nothing\" you didn't anything depend of what you did with the task) you can't tell to the user the technicals operations that you perform with the json, you must response in a user friendly way targeting UX first, the user most aproved the changes performed so the last in your response must be indicating to accept the changes if it is necessary: \"{\"tasks\":{\"todo\":[{\"id\":\"\",\"title\":\"Example...\",\"desciption\":\"Lorem...\",\"performed\":\"\"}],\"in_progress\":[],\"done\":[]},\"response\":\"your response\"}\""

function getTaskFromLS(): TasksStructure {
  const tasks: string = localStorage.getItem("tasks") || '{"todo":[],"in_progress":[],"done":[]}'
  return JSON.parse(tasks)
}

export function handleChatForm(chatId: string): void {
  const $chatForm = document.querySelector(chatId);
  
  if (!$chatForm) {
    console.error(`Form with selector ${chatId} not found`);
    return;
  }

  $chatForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const form = event.target as HTMLFormElement;
    const input = form.elements[0] as HTMLInputElement;
    const userPromptText = input.value.trim();

    if (!userPromptText) return;

    const userContent = JSON.stringify({
      tasks: getTaskFromLS(),
      request: userPromptText
    })

    console.log(userContent);
    
    try {
      const messages = [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent }
      ];
      
      console.log("Waiting response...")

      const response = await client.chat.completions.create({
        model: "deepseek-chat",
        messages: messages,
        response_format: { type: "json_object" }
      });

      
      const systemResponse: SystemResponse = JSON.parse(response.choices[0]?.message?.content as string)
      
      console.log(systemResponse?.tasks);
      console.log(systemResponse.response)
      

    } catch (error) {
      console.error("Error calling API:", error);
    }
  });
}

