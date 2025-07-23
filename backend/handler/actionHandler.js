const PrivacyHandler = require("./privacyHandler");
const PrivacyResponse = require("./privacyResponse");

class ActionHandler extends PrivacyHandler {
  constructor(action) {
    super();
    this.action = action;
  }

  canHandle(request) {
    return request.action === this.action;
  }

  async process(request) {
    if (!this.canHandle(request)) {
      return { handled: false, response: null };
    }
    return await this.processUserLevels(request);
  }

  async processUserLevels(request) {
    return {
      handled: true,
      response: PrivacyResponse.failure(
        `Action ${this.action} not implemented`
      ),
    };
  }
}

module.exports = ActionHandler;
