class PrivacyResponse {
  constructor(allowed, data, isAnon, anonName) {
    this.allowed = allowed;
    this.data = data;
    this.isANon = isAnon;
    this.anonName = anonName;

    this.reason = allowed ? "Access granted" : "Access denied";
    this.handler = null;
  }

  setReason(reason) {
    this.reason = reason;
    return this;
  }

  setHandler(handlerName) {
    this.handler = handlerName;
    return this;
  }

  static success(data, isAnon = false, anonName = null) {
    return new PrivacyResponse(true, data, isAnon, anonName);
  }
  static failure(reason = "Access Denied") {
    const response = new PrivacyResponse(false, null, false, null);
    response.setReason(reason);
    return response;
  }
  static anonymous(data, anonName) {
    return new PrivacyResponse(true, data, true, anonName);
  }

  toString() {
    return `PrivacyResponse[${this.allowed ? "Allowed" : "Denied"}] ${
      this.reason
    };`;
  }
}

module.exports = PrivacyResponse;
