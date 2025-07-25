const PrivacyHandlerCreator = require("../handler/privacyActionHandler");
const ViewProfileHandler = require("../handler/viewProfileHandler");
const ViewAttendeesHandler = require("../handler/viewAttendeesHandler");
const ViewCarpoolHandler = require("../handler/viewCarpoolHandler");
const ViewScheduleHandler = require("../handler/viewScheduleHandler");

describe("PrivacyHandlerCreator", () => {
  describe("createHandlerChain", () => {
    test("should create a chain with all handlers in correct order", () => {
      const chain = PrivacyHandlerCreator.createHandlerChain();

      expect(chain).toBeInstanceOf(ViewProfileHandler);
      expect(chain.next).toBeInstanceOf(ViewAttendeesHandler);
      expect(chain.next.next).toBeInstanceOf(ViewCarpoolHandler);
      expect(chain.next.next.next).toBeInstanceOf(ViewScheduleHandler);
      expect(chain.next.next.next.next).toBeNull();
    });
  });

  describe("createSpecificHandler", () => {
    test("should create ViewProfileHandler for view_profile action", () => {
      const handler = PrivacyHandlerCreator.createSpecificHandler("view_profile");
      expect(handler).toBeInstanceOf(ViewProfileHandler);
    });

    test("should create ViewAttendeesHandler for view_attendees action", () => {
      const handler = PrivacyHandlerCreator.createSpecificHandler("view_attendees");
      expect(handler).toBeInstanceOf(ViewAttendeesHandler);
    });

    test("should create ViewCarpoolHandler for view_carpool action", () => {
      const handler = PrivacyHandlerCreator.createSpecificHandler("view_carpool");
      expect(handler).toBeInstanceOf(ViewCarpoolHandler);
    });

    test("should create ViewScheduleHandler for view_schedule action", () => {
      const handler = PrivacyHandlerCreator.createSpecificHandler("view_schedule");
      expect(handler).toBeInstanceOf(ViewScheduleHandler);
    });

    test("should throw error for unknown action", () => {
      expect(() => {
        PrivacyHandlerCreator.createSpecificHandler("unknown_action");
      }).toThrow("Unknown action: unknown_action");
    });
  });
});
