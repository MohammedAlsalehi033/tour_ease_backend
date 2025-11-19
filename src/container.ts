//just to make a branch
import 'reflect-metadata'; 

import { container } from "tsyringe";
import { FirebaseNotifier } from "./utils/firebaseNotficationsManger";
import { OfferController } from "./controllers/rideSharing/OfferController/OfferController";
import { PrismaOfferModel } from "./models/rideSharing/offerModel";
import { FileUploaderForS3 } from "./utils/FileUploader";
import AccommodationBookingController from "./controllers/accommodationBooking/accommodationBookingController";
import AccommodationBookingModel from "./models/accommodationBooking/accommodationBookingModel";

// Register all classes as singletons
// With @injectable() decorators, tsyringe can automatically resolve dependencies
container.registerSingleton(FirebaseNotifier);
container.registerSingleton(FileUploaderForS3);
container.registerSingleton(PrismaOfferModel);
container.registerSingleton(AccommodationBookingModel);
container.registerSingleton(OfferController);
container.registerSingleton(AccommodationBookingController);

export {container}
