const PrivacyHandler = require('../../handler/privacyHandler');
const PrivacyResponse = require('../../handler/privacyResponse');

// Mock handler for testing
class MockHandler extends PrivacyHandler {
  constructor(canHandle = true, shouldHandle = true) {
    super();
    this.canHandle = canHandle;
    this.shouldHandle = shouldHandle;
    this.processed = false;
  }

  async process(request) {
    this.processed = true;
    if (this.shouldHandle) {
      return {
        handled: true,
        response: PrivacyResponse.success({ message: 'Mock handled' })
      };
    }
    return {
      handled: false,
      response: null
    };
  }
}

describe('PrivacyHandler', () => {
  let handler;
  let mockRequest;

  beforeEach(() => {
    handler = new PrivacyHandler();
    mockRequest = { action: 'test_action' };
  });

  describe('Constructor', () => {
    test('should initialize with null nextHandler', () => {
      expect(handler.nextHandler).toBeNull();
    });
  });

  describe('setNext', () => {
    test('should set next handler and return it', () => {
      const nextHandler = new MockHandler();
      const result = handler.setNext(nextHandler);
      
      expect(handler.nextHandler).toBe(nextHandler);
      expect(result).toBe(nextHandler);
    });

    test('should support method chaining', () => {
      const handler1 = new MockHandler();
      const handler2 = new MockHandler();
      const handler3 = new MockHandler();
      
      const result = handler.setNext(handler1).setNext(handler2).setNext(handler3);
      
      expect(handler.nextHandler).toBe(handler1);
      expect(handler1.nextHandler).toBe(handler2);
      expect(handler2.nextHandler).toBe(handler3);
      expect(result).toBe(handler3);
    });
  });

  describe('handle', () => {
    test('should call process method', async () => {
      const mockHandler = new MockHandler(true, true);
      const result = await mockHandler.handle(mockRequest);
      
      expect(mockHandler.processed).toBe(true);
      expect(result.allowed).toBe(true);
      expect(result.data).toEqual({ message: 'Mock handled' });
    });

    test('should pass to next handler when not handled', async () => {
      const handler1 = new MockHandler(true, false); // Can handle but won't
      const handler2 = new MockHandler(true, true);  // Will handle
      
      handler1.setNext(handler2);
      const result = await handler1.handle(mockRequest);
      
      expect(handler1.processed).toBe(true);
      expect(handler2.processed).toBe(true);
      expect(result.allowed).toBe(true);
      expect(result.data).toEqual({ message: 'Mock handled' });
    });

    test('should return default response when no handler can process', async () => {
      const result = await handler.handle(mockRequest);
      
      expect(result.allowed).toBe(false);
      expect(result.data).toBeNull();
      expect(result.isANon).toBe(false);
      expect(result.anonName).toBeNull();
    });

    test('should stop at first handler that processes request', async () => {
      const handler1 = new MockHandler(true, true);  // Will handle
      const handler2 = new MockHandler(true, true);  // Should not be called
      
      handler1.setNext(handler2);
      const result = await handler1.handle(mockRequest);
      
      expect(handler1.processed).toBe(true);
      expect(handler2.processed).toBe(false);
      expect(result.allowed).toBe(true);
    });
  });

  describe('process', () => {
    test('should return default unhandled response', async () => {
      const result = await handler.process(mockRequest);
      
      expect(result.handled).toBe(false);
      expect(result.response).toBeNull();
    });
  });
}); 