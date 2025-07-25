const {
  PrivacyHandlerCreator,
  ViewProfileHandler,
  ViewAttendeesHandler,
  ViewCarpoolHandler,
} = require("../handler/privacyActionHandler");

describe("PrivacyHandlerCreator", () => {
  test("Should create a chain of handlers in the correct order", () => {
    const chain = PrivacyHandlerCreator.createHandlerChain();

    expect(chain).toBeInstanceOf(ViewProfileHandler);
    expect(chain.action).toBe("view_profile");

    expect(chain.nextHandler).toBeInstanceOf(ViewAttendeesHandler);
    expect(chain.nextHandler.action).toBe("view_attendees");

    expect(chain.nextHandler.nextHandler).toBeInstanceOf(ViewCarpoolHandler);
    expect(chain.nextHandler.nextHandler.action).toBe("view_carpool");


    expect(chain.nextHandler.nextHandler.nextHandler).toBeNull();
  });

  test("Should create independent chain instances", () => {
    const chain1 = PrivacyHandlerCreator.createHandlerChain();
    const chain2 = PrivacyHandlerCreator.createHandlerChain();

    expect(chain1).not.toBe(chain2);
    expect(chain1.nextHandler).not.toBe(chain2.nextHandler);
  });

  test("Should create specific handler for view_profile", () => {
    const handler = PrivacyHandlerCreator.createSpecificHandler("view_profile");

    expect(handler).toBeInstanceOf(ViewProfileHandler);
    expect(handler.action).toBe("view_profile");
  });

  test("Should create viewAttendeesHandler for view_attendees", () => {
    const handler =
      PrivacyHandlerCreator.createSpecificHandler("view_attendees");

    expect(handler).toBeInstanceOf(ViewAttendeesHandler);
    expect(handler.action).toBe("view_attendees");
  });
});
