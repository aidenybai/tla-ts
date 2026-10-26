export class TlaError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "TlaError";
  }
}

export class TlaSyntaxError extends TlaError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "TlaSyntaxError";
  }
}

export class TlaConfigError extends TlaError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "TlaConfigError";
  }
}

export class TlaEvaluationError extends TlaError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "TlaEvaluationError";
  }
}

export class TlaUnsupportedError extends TlaError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "TlaUnsupportedError";
  }
}
