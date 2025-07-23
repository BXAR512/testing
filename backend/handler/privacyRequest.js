class PrivacyRequest {
  constructor(requesterId, targetId, action, functionality) {
    this.requesterId = requesterId;
    this.targetId = targetId;
    this.action = action;
    this.functionality = functionality;

    this.result = null;
    this.allowed = false;

    this.context = {};
  }

  setContext(key, value) {
    this.context[key] = value;
  }

  getContext(key) {
    return this.context[key];
  }

  isSelfRequest() {
    return this.requesterId === this.targetId;
  }

  toString() {
    return `PrivacyRequest[${this.action}] User ${this.requesterId} to ${this.targetId} (${this.functionality})`;
  }
}

module.exports = PrivacyRequest;
