const ActionHandler = require("./actionHandler");
const ViewProfileHandler = require("./viewProfileHandler");
const ViewFriendsHandler = require("./viewFriendsHandler");
const ViewAttendeesHandler = require("./viewAttendeesHandler");

class PrivacyHandlerCreator{
    static createHandlerChain(){
        const viewProfileHandler = new ViewProfileHandler();
        const viewFriendsHandler = new ViewFriendsHandler();
        const viewAttendeesHandler = new ViewAttendeesHandler();

        viewProfileHandler
        .setNext(viewFriendsHandler)
        .setNext(viewAttendeesHandler);

    return viewProfileHandler;
    }

    static createSpecificHandler(action){
        switch (action) {
            case 'view_profile':
                return new ViewProfileHandler();
            case 'view_friends':
                return new ViewFriendsHandler();
            case 'view_attendees':
                return new ViewAttendeesHandler();
            default:
                throw new Error(`Unkown action: ${action}`);
        }
    }
}

module.exports = {
    ActionHandler,
    ViewProfileHandler,
    ViewFriendsHandler,
    ViewAttendeesHandler,
    PrivacyHandlerCreator
}