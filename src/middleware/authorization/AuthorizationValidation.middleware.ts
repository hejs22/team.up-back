import { NextFunction, Request, RequestHandler, Response } from 'express';
import UserUnauthorizedResponse from '../../controllers/authentication/dto/UserUnauthorizedResponse';
import { RequestWithUser } from '../../types/User';
import { UserRole } from '../../types/UserRole';

function authorizationValidation<T>(allowedRoles: UserRole[]): RequestHandler {
  return (request: Request, response: Response, next: NextFunction) => {
    const requestWithUser = request as RequestWithUser;
    const userToAuthorize = requestWithUser.user;
    if (userToAuthorize && allowedRoles.includes(userToAuthorize.role)) {
      next();
    } else {
      next(new UserUnauthorizedResponse());
    }
  };
}

export default authorizationValidation;
