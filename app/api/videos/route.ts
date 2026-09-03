export function GET(){return Response.json({videos:[]});}
function disabled(){return Response.json({error:"Video uploads are disabled for this hosting setup."},{status:405,headers:{Allow:"GET"}});}
export const POST=disabled;export const DELETE=disabled;
