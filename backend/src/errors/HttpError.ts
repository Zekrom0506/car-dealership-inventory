/**
 * An error that maps directly to an HTTP response.
 * Throw it anywhere (service, controller, validation); the error handler sends
 * `{ error: message }` with the given status code.
 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}
