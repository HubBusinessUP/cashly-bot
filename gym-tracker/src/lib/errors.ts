export class ConflictError extends Error {
  constructor(message = 'Questa voce è stata modificata altrove. Ricarica e riprova.') {
    super(message)
    this.name = 'ConflictError'
  }
}

export class AuthRequiredError extends Error {
  constructor(message = 'Devi accedere per farlo.') {
    super(message)
    this.name = 'AuthRequiredError'
  }
}
