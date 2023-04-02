export class UnauthorizedError extends Error {
  public inner: { message: string }
  public data: { message: string; code: string; type: 'UnauthorizedError' }

  constructor(code: string, error: { message: string }) {
    super(error.message)
    this.name = 'UnauthorizedError'
    this.inner = error
    this.data = {
      message: this.message,
      code,
      type: 'UnauthorizedError'
    }
    Object.setPrototypeOf(this, UnauthorizedError.prototype)
  }
}

export const isUnauthorizedError = (
  error: unknown
): error is UnauthorizedError => {
  return (
    error instanceof UnauthorizedError &&
    error.data.type === 'UnauthorizedError'
  )
}
