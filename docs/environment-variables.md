# Environment Variables Documentation

| Variable       | Description                                                       | Default                               | Used In                      |
| -------------- | ----------------------------------------------------------------- | ------------------------------------- | ---------------------------- |
| `PORT`         | The port on which the server will listen                          | `8080`                                | index.js                     |
| `DB_CONN_STR`  | MongoDB connection string                                         | `mongodb://127.0.0.1:27017/api-proxy` | index.js                     |
| `PASSWORD`     | Password used to authenticate for proxy management operations     | None (Required)                       | verifyPassword.middleware.js |
| `LOGGING_HOST` | Host for the Winston HTTP transport logger                        | `localhost`                           | logger.js                    |
| `LOGGING_PORT` | Port for the Winston HTTP transport logger                        | None (Required)                       | logger.js                    |
| `LOGGING_SSL`  | Whether to use SSL for logger transport (set to 'true' to enable) | `false`                               | logger.js                    |
