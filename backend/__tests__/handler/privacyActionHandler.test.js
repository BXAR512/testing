const { PrivacyHandlerCreator, ViewProfileHandler, ViewFriendsHandler, ViewAttendeesHandler } = require('../../handler/privacyActionHandler');

describe('PrivacyHandlerCreator', () => {
  describe('createHandlerChain', () => {
    test('should create a chain of handlers in correct order', () => {
      const chain = PrivacyHandlerCreator.createHandlerChain();
      
      // Should return the first handler in the chain
      expect(chain).toBeInstanceOf(ViewProfileHandler);
      expect(chain.action).toBe('view_profile');
      
      // Check the chain structure
      expect(chain.nextHandler).toBeInstanceOf(ViewFriendsHandler);
      expect(chain.nextHandler.action).toBe('view_friends');
      
      expect(chain.nextHandler.nextHandler).toBeInstanceOf(ViewAttendeesHandler);
      expect(chain.nextHandler.nextHandler.action).toBe('view_attendees');
      
      // Last handler should have no next handler
      expect(chain.nextHandler.nextHandler.nextHandler).toBeNull();
    });

    test('should create independent chain instances', () => {
      const chain1 = PrivacyHandlerCreator.createHandlerChain();
      const chain2 = PrivacyHandlerCreator.createHandlerChain();
      
      // Chains should be independent
      expect(chain1).not.toBe(chain2);
      expect(chain1.nextHandler).not.toBe(chain2.nextHandler);
    });
  });

  describe('createSpecificHandler', () => {
    test('should create ViewProfileHandler for view_profile action', () => {
      const handler = PrivacyHandlerCreator.createSpecificHandler('view_profile');
      
      expect(handler).toBeInstanceOf(ViewProfileHandler);
      expect(handler.action).toBe('view_profile');
    });

    test('should create ViewFriendsHandler for view_friends action', () => {
      const handler = PrivacyHandlerCreator.createSpecificHandler('view_friends');
      
      expect(handler).toBeInstanceOf(ViewFriendsHandler);
      expect(handler.action).toBe('view_friends');
    });

    test('should create ViewAttendeesHandler for view_attendees action', () => {
      const handler = PrivacyHandlerCreator.createSpecificHandler('view_attendees');
      
      expect(handler).toBeInstanceOf(ViewAttendeesHandler);
      expect(handler.action).toBe('view_attendees');
    });

    test('should throw error for unknown action', () => {
      expect(() => {
        PrivacyHandlerCreator.createSpecificHandler('unknown_action');
      }).toThrow('Unkown action: unknown_action');
    });

    test('should throw error for null action', () => {
      expect(() => {
        PrivacyHandlerCreator.createSpecificHandler(null);
      }).toThrow('Unkown action: null');
    });

    test('should throw error for undefined action', () => {
      expect(() => {
        PrivacyHandlerCreator.createSpecificHandler(undefined);
      }).toThrow('Unkown action: undefined');
    });
  });

  describe('Handler Chain Processing', () => {
    test('should process request through chain until handled', async () => {
      const chain = PrivacyHandlerCreator.createHandlerChain();
      const request = { action: 'view_friends' };
      
      // Mock the process method to simulate handling
      const mockProcess = jest.fn();
      chain.nextHandler.process = mockProcess.mockResolvedValue({
        handled: true,
        response: { allowed: true, data: 'friends data' }
      });
      
      const result = await chain.handle(request);
      
      expect(mockProcess).toHaveBeenCalledWith(request);
      expect(result).toEqual({ allowed: true, data: 'friends data' });
    });

    test('should pass request to next handler when current handler does not handle', async () => {
      const chain = PrivacyHandlerCreator.createHandlerChain();
      const request = { action: 'view_attendees' };
      
      // Mock the process methods
      const mockProcess1 = jest.fn().mockResolvedValue({ handled: false, response: null });
      const mockProcess2 = jest.fn().mockResolvedValue({ handled: false, response: null });
      const mockProcess3 = jest.fn().mockResolvedValue({
        handled: true,
        response: { allowed: true, data: 'attendees data' }
      });
      
      chain.process = mockProcess1;
      chain.nextHandler.process = mockProcess2;
      chain.nextHandler.nextHandler.process = mockProcess3;
      
      const result = await chain.handle(request);
      
      expect(mockProcess1).toHaveBeenCalledWith(request);
      expect(mockProcess2).toHaveBeenCalledWith(request);
      expect(mockProcess3).toHaveBeenCalledWith(request);
      expect(result).toEqual({ allowed: true, data: 'attendees data' });
    });
  });
}); 