import express from 'express';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import { Controller } from 'types/Controller';
import mongoose from 'mongoose';
import errorMiddleware from './middleware/error-handling/Error.middleware';
import cookieParser from 'cookie-parser';
import requestLogger from './middleware/logging/RequestLogger.middleware';
import Logger from './helpers/Logger';
import DatabaseConfig from './config/DatabaseConfig';
import cors from 'cors';
import ResourceNotFoundResponse from './helpers/ResourceNotFoundResponse';
import ApplicationConfig from './config/ApplicationConfig';

class App {
  public app: express.Application;
  public port: number;

  constructor(controllers: Controller[], port: number) {
    const { NODE_ENV } = process.env;

    this.app = express();
    this.port = NODE_ENV === 'test' ? 0 : port;

    this.initializeDatabaseConnection();
    this.initializeMiddlewares();
    this.initializeControllers(controllers);
    this.initializeErrorHandling();
  }

  private initializeMiddlewares() {
    this.app.use(requestLogger);
    this.app.use(cors(this.getCorsSettings()));
    this.app.use(helmet());
    this.app.use(bodyParser.json());
    this.app.use(cookieParser());
  }

  private initializeControllers(controllers: Controller[]) {
    controllers.forEach((controller: Controller) => {
      this.app.use('/app/', controller.router);
    });
  }

  private initializeErrorHandling() {
    this.app.use((req, res, next) => {
      next(new ResourceNotFoundResponse());
    });
    this.app.use(errorMiddleware);
  }

  private initializeDatabaseConnection() {
    const { NODE_ENV } = process.env;
    if (NODE_ENV === 'test') {
      mongoose.connect(DatabaseConfig.testConnectionPath);
    } else {
      mongoose.connect(DatabaseConfig.connectionPath);
    }
  }

  private getCorsSettings() {
    return {
      origin: ApplicationConfig.frontendUrl,
      credentials: true,
      optionsSuccessStatus: 200,
      methods: ['POST', 'PUT', 'OPTIONS', 'DELETE', 'GET', 'PATCH'],
      allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
    };
  }

  public listen() {
    this.app.listen(this.port, () => {
      Logger.info(`App listening on the port ${this.port}`);
    });
  }
}

export default App;
