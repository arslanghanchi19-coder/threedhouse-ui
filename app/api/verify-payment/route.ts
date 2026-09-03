// No legacy payment signature can create an order on the new backend.
export function POST(){return Response.json({error:"Online payment verification is disabled pending payment integration testing."},{status:503});}
