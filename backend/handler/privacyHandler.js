class PrivacyHandler {
  constructor() {
    this.nextHandler = null;
  }
  setNext(handler) {
    this.nextHandler = handler;
    return handler;
  }
  async handle(request) {
    const result = await this.process(request);

    if (result.handled) {
      return result.response;
    }

    if (this.nextHandler) {
      return await this.nextHandler.handle(request);
    }

    return new PrivacyResponse(false, null, false, null);
  }
  async process(request) {
    return {
      handled: false,
      response: null,
    };
  }
}

module.exports = PrivacyHandler;
