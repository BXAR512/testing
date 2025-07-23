const PrivacyResponse = require('../../handler/privacyResponse');

describe('PrivacyResponse', () => {
  describe('Constructor', () => {
    test('should create a response with correct properties', () => {
      const response = new PrivacyResponse(true, { name: 'John' }, false, null);
      
      expect(response.allowed).toBe(true);
      expect(response.data).toEqual({ name: 'John' });
      expect(response.isANon).toBe(false);
      expect(response.anonName).toBeNull();
      expect(response.reason).toBe('Access granted');
      expect(response.handler).toBeNull();
    });

    test('should set default reason for denied access', () => {
      const response = new PrivacyResponse(false, null, false, null);
      expect(response.reason).toBe('Access denied');
    });
  });

  describe('Static Methods', () => {
    test('should create success response', () => {
      const data = { name: 'John', email: 'john@example.com' };
      const response = PrivacyResponse.success(data);
      
      expect(response.allowed).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.isANon).toBe(false);
      expect(response.anonName).toBeNull();
      expect(response.reason).toBe('Access granted');
    });

    test('should create success response with anonymous flag', () => {
      const data = { id: '123' };
      const response = PrivacyResponse.success(data, true, 'Anonymous');
      
      expect(response.allowed).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.isANon).toBe(true);
      expect(response.anonName).toBe('Anonymous');
    });

    test('should create failure response', () => {
      const response = PrivacyResponse.failure('User not found');
      
      expect(response.allowed).toBe(false);
      expect(response.data).toBeNull();
      expect(response.isANon).toBe(false);
      expect(response.anonName).toBeNull();
      expect(response.reason).toBe('User not found');
    });

    test('should create failure response with default reason', () => {
      const response = PrivacyResponse.failure();
      
      expect(response.allowed).toBe(false);
      expect(response.data).toBeNull();
      expect(response.reason).toBe('Access Denied');
    });

    test('should create anonymous response', () => {
      const data = { id: '123', isAnonymous: true };
      const response = PrivacyResponse.anonymous(data, 'Anonymous User');
      
      expect(response.allowed).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.isANon).toBe(true);
      expect(response.anonName).toBe('Anonymous User');
    });
  });

  describe('Method Chaining', () => {
    test('should chain setReason method', () => {
      const response = PrivacyResponse.success({})
        .setReason('Custom reason')
        .setHandler('TestHandler');
      
      expect(response.reason).toBe('Custom reason');
      expect(response.handler).toBe('TestHandler');
    });

    test('should chain setHandler method', () => {
      const response = PrivacyResponse.failure()
        .setHandler('ViewProfileHandler');
      
      expect(response.handler).toBe('ViewProfileHandler');
    });
  });

  describe('toString', () => {
    test('should return formatted string for allowed response', () => {
      const response = PrivacyResponse.success({ name: 'John' });
      expect(response.toString()).toBe('PrivacyResponse[Allowed] Access granted;');
    });

    test('should return formatted string for denied response', () => {
      const response = PrivacyResponse.failure('User not found');
      expect(response.toString()).toBe('PrivacyResponse[Denied] User not found;');
    });
  });
}); 