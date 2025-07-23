const PrivacyRequest = require('../../handler/privacyRequest');

describe('PrivacyRequest', () => {
  let request;

  beforeEach(() => {
    request = new PrivacyRequest('user123', 'user456', 'view_profile', 'profile_viewing');
  });

  describe('Constructor', () => {
    test('should create a privacy request with correct properties', () => {
      expect(request.requesterId).toBe('user123');
      expect(request.targetId).toBe('user456');
      expect(request.action).toBe('view_profile');
      expect(request.functionality).toBe('profile_viewing');
      expect(request.result).toBeNull();
      expect(request.allowed).toBe(false);
      expect(request.context).toEqual({});
    });
  });

  describe('Context Management', () => {
    test('should set and get context values', () => {
      request.setContext('location', 'public');
      request.setContext('time', 'daytime');

      expect(request.getContext('location')).toBe('public');
      expect(request.getContext('time')).toBe('daytime');
      expect(request.context).toEqual({
        location: 'public',
        time: 'daytime'
      });
    });

    test('should return undefined for non-existent context key', () => {
      expect(request.getContext('nonexistent')).toBeUndefined();
    });
  });

  describe('Self Request Detection', () => {
    test('should return true for self request', () => {
      const selfRequest = new PrivacyRequest('user123', 'user123', 'view_profile', 'profile_viewing');
      expect(selfRequest.isSelfRequest()).toBe(true);
    });

    test('should return false for non-self request', () => {
      expect(request.isSelfRequest()).toBe(false);
    });
  });

  describe('toString', () => {
    test('should return formatted string representation', () => {
      const expected = 'PrivacyRequest[view_profile] User user123 to user456 (profile_viewing)';
      expect(request.toString()).toBe(expected);
    });
  });
}); 