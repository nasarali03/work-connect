// swagger.js
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Labour App API",
      version: "1.0.0",
      description: "API documentation for the Labour App",
    },
    servers: [
      {
        url: "http://localhost:5000", // Update with your server URL
        description: "Local server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./routes/*.js"], // Path to your route files
};

const swaggerSpec = swaggerJsDoc(options);

export default (app) => {
  // Swagger UI route
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
