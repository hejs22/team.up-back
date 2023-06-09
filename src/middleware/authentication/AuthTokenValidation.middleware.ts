import { NextFunction, Response, Request } from 'express';
import InvalidAuthTokenResponse from '../../controllers/authentication/dto/InvalidAuthTokenResponse';
import { authenticationService } from '../../server';
import { RequestWithUser } from '../../types/User';

async function authTokenValidation(request: Request, response: Response, next: NextFunction) {
  const requestWithUser = request as RequestWithUser;
  const authorizationCookie: string = requestWithUser.cookies.Authorization;

  if (authorizationCookie) {
    try {
      const maybeUser = await authenticationService.getUserFromToken(authorizationCookie, 'Authorization');

      if (maybeUser) {
        requestWithUser.user = maybeUser;
        next();
      } else {
        next(new InvalidAuthTokenResponse());
      }
    } catch (e) {
      next(new InvalidAuthTokenResponse());
    }
  } else {
    next(new InvalidAuthTokenResponse());
  }
}

export default authTokenValidation;
