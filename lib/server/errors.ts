export class AppError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export function failure(error: unknown) {
  return Response.json({error:error instanceof AppError ? error.message : "Something went wrong. Please try again."},
    {status:error instanceof AppError ? error.status : 500, headers:{"Cache-Control":"no-store"}});
}
