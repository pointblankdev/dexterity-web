// Define your models here.

export interface Model {
  id: string;
  label: string;
  apiIdentifier: string;
  description: string;
}

export const models: Array<Model> = [
  {
    id: "claude-3-haiku",
    label: "Claude 3 Haiku",
    apiIdentifier: "claude-3-5-haiku-20241022",
    description: "Fast and efficient for everyday tasks",
  },
  {
    id: "claude-3-sonnet",
    label: "Claude 3 Sonnet",
    apiIdentifier: "claude-3-5-sonnet-20241022",
    description: "Balanced performance for most use cases",
  },
  {
    id: "claude-3-opus",
    label: "Claude 3 Opus",
    apiIdentifier: "claude-3-opus-20240229",
    description: "Most capable model for complex tasks",
  },
  // {
  //   id: "gpt-4o-mini",
  //   label: "GPT 4o mini",
  //   apiIdentifier: "gpt-4o-mini",
  //   description: "Small model for fast, lightweight tasks",
  // },
  // {
  //   id: "gpt-4o",
  //   label: "GPT 4o",
  //   apiIdentifier: "gpt-4o",
  //   description: "For complex, multi-step tasks",
  // },
  // {
  //   id: "gpt-4o-canvas",
  //   label: "GPT 4o with Canvas",
  //   apiIdentifier: "gpt-4o",
  //   description: "Collaborate with writing",
  // },
] as const;

export const DEFAULT_MODEL_NAME: string = "claude-3-sonnet";
// export const DEFAULT_MODEL_NAME: string = 'claude-3-haiku';
