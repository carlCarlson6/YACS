export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string) {
    super(404, "NOT_FOUND", `${entity} not found`);
  }
}

export class RevertError extends AppError {
  constructor(message: string) {
    super(400, "REVERT_ERROR", message);
  }
}
