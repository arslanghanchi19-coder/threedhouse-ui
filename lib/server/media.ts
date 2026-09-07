import "server-only";
import { getStore, getDeployStore } from "@netlify/blobs";

export function mediaStore() {
  return process.env.CONTEXT === "production" ? getStore("media") : getDeployStore("media");
}
