import { NextFunction, Request, Response, Router } from 'express';
import EventService from '../../services/event/Event.service';
import SportService from '../../services/sport/Sport.service';
import SportDisciplineNotFoundResponse from '../sport/dto/SportDisciplineNotFoundResponse';
import EventNotFoundResponse from './dto/EventNotFoundResponse';
import NotAuthorizedToModifyEventResponse from './dto/NotAuthorizedToModifyEventResponse';
import authTokenValidation from '../../middleware/authentication/AuthTokenValidation.middleware';
import dtoValidation from '../../middleware/error-handling/DtoValidation.middleware';
import CreateEventRequest from './dto/CreateEventRequest.dto';
import UpdateEventRequest from './dto/UpdateEventRequest';
import { Controller } from '../../types/Controller';
import { RequestWithUser } from '../../types/User';

class EventController implements Controller {
  public path = '/sports';
  public router = Router();
  private eventService: EventService;
  private sportService: SportService;

  constructor(eventService: EventService, sportService: SportService) {
    this.eventService = eventService;
    this.sportService = sportService;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router
      .all(this.path.concat('/:id/events'), this.validateDisciplineExistence)
      .get(this.path.concat('/:id/events'), this.getEventsFromDiscipline)
      .post(this.path.concat('/:id/events'), authTokenValidation, dtoValidation(CreateEventRequest), this.createEvent)
      .put(
        this.path.concat('/:id/events/:eventId'),
        authTokenValidation,
        dtoValidation(UpdateEventRequest),
        this.updateEvent
      )
      .delete(this.path.concat('/:id/events/:eventId'), authTokenValidation, this.deleteEvent);
  }

  private validateDisciplineExistence = async (request: Request, response: Response, next: NextFunction) => {
    const disciplineId = request.params.id;
    if (!(await this.sportService.existsById(disciplineId))) {
      next(new SportDisciplineNotFoundResponse());
    } else next();
  };

  private getEventsFromDiscipline = async (request: Request, response: Response, next: NextFunction) => {
    response.send(await this.eventService.findAllByDisciplineId(request.params.id));
  };

  private createEvent = async (request: Request, response: Response, next: NextFunction) => {
    const requestWithUser = request as RequestWithUser;
    const savedEvent = await this.eventService.saveEventWithUserIdAndDisciplineId(
      requestWithUser.body,
      requestWithUser.user._id,
      requestWithUser.params.id
    );
    response.send(savedEvent);
  };

  private updateEvent = async (request: Request, response: Response, next: NextFunction) => {
    const requestWithUser = request as RequestWithUser;
    const eventId = requestWithUser.params.eventId;
    const user = requestWithUser.user;

    const eventToEdit = await this.eventService.findById(eventId);
    if (!eventToEdit) {
      next(new EventNotFoundResponse());
    }

    if (!(await this.eventService.isUserAuthorizedToModifyEvent(user, eventId))) {
      next(new NotAuthorizedToModifyEventResponse());
    }

    response.send(await this.eventService.updateEvent(eventId, request.body));
  };

  private deleteEvent = async (request: Request, response: Response, next: NextFunction) => {
    const requestWithUser = request as RequestWithUser;
    const eventId = requestWithUser.params.eventId;
    const user = requestWithUser.user;
    const eventToDelete = await this.eventService.findById(eventId);

    if (!eventToDelete) {
      next(new EventNotFoundResponse());
    }

    if (!(await this.eventService.isUserAuthorizedToModifyEvent(user, eventId))) {
      next(new NotAuthorizedToModifyEventResponse());
    }

    response.send(await this.eventService.deleteEvent(eventId));
  };
}

export default EventController;
