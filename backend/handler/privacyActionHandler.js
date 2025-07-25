const ActionHandler = require("./actionHandler");
const ViewProfileHandler = require("./viewProfileHandler");
const ViewAttendeesHandler = require("./viewAttendeesHandler");
const ViewCarpoolHandler = require("./viewCarpoolHandler");
const ViewScheduleHandler = require("./viewScheduleHandler");

class PrivacyHandlerCreator{
    static createHandlerChain(){
        const viewProfileHandler = new ViewProfileHandler();
        const viewAttendeesHandler = new ViewAttendeesHandler();
        const viewCarpoolHandler = new ViewCarpoolHandler();
        const viewScheduleHandler = new ViewScheduleHandler();

        viewProfileHandler
            .setNext(viewAttendeesHandler)
            .setNext(viewCarpoolHandler)
            .setNext(viewScheduleHandler);

        return viewProfileHandler;
    }

    static createSpecificHandler(action){
        switch (action) {
            case 'view_profile':
                return new ViewProfileHandler();
            case 'view_attendees':
                return new ViewAttendeesHandler();
            case 'view_carpool':
                return new ViewCarpoolHandler();
            case 'view_schedule':
                return new ViewScheduleHandler();
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }
}

module.exports = PrivacyHandlerCreator;