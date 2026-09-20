export class ConflictError extends Error {
  constructor(message = 'This entry was changed elsewhere. Reload and try again.') {
    super(message)
    this.name = 'ConflictError'
  }
}

export class AuthRequiredError extends Error {
  constructor(message = 'You must be signed in to do this.') {
    super(message)
    this.name = 'AuthRequiredError'
  }
}
