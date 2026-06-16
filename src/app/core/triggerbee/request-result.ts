export class RequestResult<T> {
  constructor(
    public readonly error: string | unknown,
    public readonly data: T,
    public readonly statusCode: number,
  ) {}
  public isPositive(): boolean {
    return this.statusCode >= 200 && this.statusCode <= 299;
  }
  public isNotFound(): boolean {
    return this.statusCode === 404;
  }
  public isConflict(): boolean {
    return this.statusCode === 409;
  }
  public isBadRequest(): boolean {
    return this.statusCode === 400;
  }
  public isUnauthorized(): boolean {
    return this.statusCode === 401;
  }
  public isForbidden(): boolean {
    return this.statusCode === 403;
  }
}
