import PocketBase from "pocketbase";
import { PUBLIC_POCKETBASE_URL } from "$env/static/public";
console.log("PB URL:", PUBLIC_POCKETBASE_URL);

export const pb = new PocketBase(PUBLIC_POCKETBASE_URL);
