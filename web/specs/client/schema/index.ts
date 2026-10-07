import { defineSchema } from "../../../src/lib/spec/define.ts";
import account from "./account.ts";
import auth from "./auth.ts";
import checkout from "./checkout.ts";
import details from "./details.ts";
import home from "./home.ts";

export default defineSchema({
    screens: [home, auth, details, checkout, account],
});
