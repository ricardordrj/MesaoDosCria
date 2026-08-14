export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message)
  }
}

export function notFound(message = 'Não encontrado'): HttpError {
  return new HttpError(404, message)
}

export function conflict(message: string): HttpError {
  return new HttpError(409, message)
}

export function badRequest(message: string): HttpError {
  return new HttpError(400, message)
}
