const ActionHandler = require("./actionHandler");
const ViewProfileHandler = require("./viewProfileHandler");
const ViewAttendeesHandler = require("./viewAttendeesHandler");
const ViewCarpoolHandler = require("./viewCarpoolHandler");

class PrivacyHandlerCreator{
    static createHandlerChain(){
        const viewProfileHandler = new ViewProfileHandler();
        const viewAttendeesHandler = new ViewAttendeesHandler();
        const viewCarpoolHandler = new ViewCarpoolHandler();

        viewProfileHandler
        .setNext(viewAttendeesHandler)
        .setNext(viewCarpoolHandler);

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
            default:
                throw new Error(`Unkown action: ${action}`);
        }
    }
}

module.exports = {
    ActionHandler,
    ViewProfileHandler,
    ViewAttendeesHandler,
    ViewCarpoolHandler,
    PrivacyHandlerCreator
}