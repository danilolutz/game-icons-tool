export interface ICommand {
  command: string;
  description: string;
  execute(...args: any): void;
}
