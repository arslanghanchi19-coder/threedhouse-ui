// Do not accept payments until the replacement order binding and reconciliation flow is tested.
export function POST(){return Response.json({error:"Online payments are temporarily unavailable. Please use Cash on Delivery when checkout opens."},{status:503});}
