import PocketBase from "pocketbase";
import { env } from "$env/dynamic/private";

export function getServerPB() {
  const url = env.POCKETBASE_URL ?? "http://127.0.0.1:8090";
  console.log("SERVER PocketBase URL:", url);
  return new PocketBase(url);
}
