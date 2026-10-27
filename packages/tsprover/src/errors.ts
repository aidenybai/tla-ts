export class TsproverError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TsproverError";
  }
}
