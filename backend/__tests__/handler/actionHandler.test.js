const ActionHandler = require('../../handler/actionHandler');
const PrivacyRequest = require('../../handler/privacyRequest');
const PrivacyResponse = require('../../handler/privacyResponse');

describe('ActionHandler', () => {
  let handler;
  let request;

  beforeEach(() => {
    handler = new ActionHandler('view_profile');
    request = new PrivacyRequest('user123', 'user456', 'view_profile', 'profile_viewing');
  });

  describe('Constructor', () => {
    test('should create handler with specified action', () => {
      expect(handler.action).toBe('view_profile');
    });
  });

  describe('canHandle', () => {
    test('should return true for matching action', () => {
      expect(handler.canHandle(request)).toBe(true);
    });

    test('should return false for non-matching action', () => {
      const differentRequest = new PrivacyRequest('user123', 'user456', 'view_friends', 'friends_viewing');
      expect(handler.canHandle(differentRequest)).toBe(false);
    });
  });

  describe('process', () => {
    test('should return unhandled when action does not match', async () => {
      const differentRequest = new PrivacyRequest('user123', 'user456', 'view_friends', 'friends_viewing');
      const result = await handler.process(differentRequest);
      
      expect(result.handled).toBe(false);
      expect(result.response).toBeNull();
    });

    test('should call processUserLevels when action matches', async () => {
      const result = await handler.process(request);
      
      expect(result.handled).toBe(true);
      expect(result.response.allowed).toBe(false);
      expect(result.response.reason).toBe('Action view_profile not implemented');
    });
  });

  describe('processUserLevels', () => {
    test('should return not implemented response', async () => {
      const result = await handler.processUserLevels(request);
      
      expect(result.handled).toBe(true);
      expect(result.response.allowed).toBe(false);
      expect(result.response.reason).toBe('Action view_profile not implemented');
    });
  });
}); 