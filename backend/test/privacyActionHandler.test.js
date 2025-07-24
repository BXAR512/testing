const {
  PrivacyHandlerCreator,
  ViewProfileHandler,
  ViewFriendsHandler,
  ViewAttendeesHandler,
} = require("../handler/privacyActionHandler");

describe("PrivacyHandlerCreator", () => {
  test("Should create a chain of handlers in the correct order", () => {
    const chain = PrivacyHandlerCreator.createHandlerChain();

    expect(chain).toBeInstanceOf(ViewProfileHandler);
    expect(chain.action).toBe("view_profile");

    expect(chain.nextHandler).toBeInstanceOf(ViewFriendsHandler);
    expect(chain.nextHandler.action).toBe("view_friends");

    expect(chain.nextHandler.nextHandler).toBeInstanceOf(ViewAttendeesHandler);
    expect(chain.nextHandler.nextHandler.action).toBe("view_attendees");

    expect(chain.nextHandler.nextHandler.nextHandler).toBeNull();
  });

  test('Should create independent chain instances', () => {
    const chain1 = PrivacyHandlerCreator.createHandlerChain();
    const chain2 = PrivacyHandlerCreator.createHandlerChain();

    expect(chain1).not.toBe(chain2);
    expect(chain1.nextHandler).not.toBe(chain2.nextHandler);
  });

    test('Should create specific handler', () => {
    const handler = PrivacyHandlerCreator.createSpecificHandler('view_profile');

    expect(handler).toBeInstanceOf(ViewProfileHandler);
    expect(handler.action).toBe('view_profile');
  });

    test('Should create viewFriendsHandler for respective action', () => {
    const handler = PrivacyHandlerCreator.createSpecificHandler('view_friends');

    expect(handler).toBeInstanceOf(ViewFriendsHandler);
    expect(handler.action).toBe('view_friends');
  });
      test('Should create viewAttendeesHandler for respective action', () => {
    const handler = PrivacyHandlerCreator.createSpecificHandler('view_attendees');

    expect(handler).toBeInstanceOf(ViewAttendeesHandler);
    expect(handler.action).toBe('view_attendees');
  });
});
