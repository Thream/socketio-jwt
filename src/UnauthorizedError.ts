export class UnauthorizedError extends Error {
  public inner: { message: string }
  public data: { message: string; code: string; type: 'UnauthorizedError' }

  constructor(code: string, error: { message: string }) {
    super(error.message)
    this.message = error.message
    this.inner = error
    this.data = {
      message: this.message,
      code,
      type: 'UnauthorizedError'
    }
    Object.setPrototypeOf(this, UnauthorizedError.prototype)
  }
}

export const isUnauthorizedError = (error: any): error is UnauthorizedError => {
  return error.data.type === 'UnauthorizedError'
}
