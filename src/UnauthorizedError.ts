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
    typeof error === 'object' &&
    error != null &&
    'data' in error &&
    typeof error.data === 'object' &&
    error.data != null &&
    'type' in error.data &&
    error.data.type === 'UnauthorizedError'
  )
}
