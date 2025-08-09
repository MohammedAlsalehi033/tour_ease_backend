import 'reflect-metadata'; 

import { container } from "tsyringe";
import { FirebaseNotifier } from "./utils/firebaseNotficationsManger";

container.registerSingleton(FirebaseNotifier)

export {container}
