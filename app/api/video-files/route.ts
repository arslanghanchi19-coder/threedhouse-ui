export function GET(){return new Response("Video hosting is disabled.",{status:410});}
export function POST(){return Response.json({error:"Video uploads are disabled."},{status:405});}
export const DELETE=POST;
