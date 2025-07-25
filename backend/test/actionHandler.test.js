const ActionHandler = require("../handler/actionHandler");
const PrivacyRequest = require("../handler/privacyRequest");

describe("ActionHandler", () => {
  let handler;
  let request;

  beforeEach(() => {
    handler = new ActionHandler("view_profile");
    request = new PrivacyRequest(
      "user123",
      "user456",
      "view_profile",
      "profile_viewing"
    );
  });

    test("Should create handler with a specified action", () => {
      expect(handler.action).toBe("view_profile");
    });

    test("should return true for matching action", () => {
      expect(handler.canHandle(request)).toBe(true);
          });
    test("should return false for different action", () => {
      const differentRequest = new PrivacyRequest(
      "user123",
      "user456",
      "view_attendees",
      "attendees_viewing")
      expect(handler.canHandle(differentRequest)).toBe(false);
  });

    test("should return unhandled when action does not match", async() => {
      const differentRequest = new PrivacyRequest(
      "user123",
      "user456",
      "view_attendees",
      "attendees_viewing");
      const result = await handler.process(differentRequest)  
      expect(result.handled).toBe(false);
      expect(result.response).toBeNull();
    });

    test("should call proccessUserLevels when action matches", async () => {
      const result = await handler.process(request);

      expect(result.handled).toBe(true);
      expect(result.response.allowed).toBe(false);
      expect(result.response.reason).toBe("Action view_profile not implemented");
    });
    
  test("should return not implemented response", async() => {
      const result = await handler.processUserLevels(request)  
      expect(result.handled).toBe(true);
      expect(result.response.allowed).toBe(false);
      expect(result.response.reason).toBe("Action view_profile not implemented");
    });
});
