const swaggerUi = require("swagger-ui-express");

const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "TurnUP Backend API",
    version: "1.0.0",
    description: "API documentation for TurnUP backend services.",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Local server",
    },
  ],
  tags: [
    { name: "Auth", description: "Authentication and account endpoints" },
    { name: "Store", description: "Store management endpoints" },
    { name: "Queue", description: "Queue endpoints (currently no routes implemented)" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          message: { type: "string" },
        },
      },
      UserPublic: {
        type: "object",
        properties: {
          _id: { type: "string", example: "6801234567890abcdef1234" },
          name: { type: "string", example: "John Doe" },
          email: { type: "string", format: "email", example: "john@example.com" },
          role: { type: "string", example: "CLIENT" },
          storeId: { type: "string", nullable: true },
        },
      },
      RegisterRequest: {
        type: "object",
        required: ["name", "email", "password", "role"],
        properties: {
          name: { type: "string", example: "John Doe" },
          email: { type: "string", format: "email", example: "john@example.com" },
          password: { type: "string", minLength: 6, example: "secret123" },
          role: {
            type: "string",
            enum: ["serviceProvider", "RECEPTIONIST", "CLIENT"],
            example: "CLIENT",
          },
        },
      },
      RegisterResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "User registered successfully" },
          userId: { type: "string", example: "6801234567890abcdef1234" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "john@example.com" },
          password: { type: "string", example: "secret123" },
        },
      },
      LoginResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "Login successful" },
          token: { type: "string" },
          role: { type: "string", example: "CLIENT" },
        },
      },
      UpdatePasswordRequest: {
        type: "object",
        required: ["email", "newPassword"],
        properties: {
          email: { type: "string", format: "email" },
          newPassword: { type: "string", minLength: 6 },
        },
      },
      ForgotPasswordRequest: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string", format: "email" },
        },
      },
      VerifyOtpRequest: {
        type: "object",
        required: ["email", "otp"],
        properties: {
          email: { type: "string", format: "email" },
          otp: { type: "string", example: "123456" },
        },
      },
      ResetPasswordRequest: {
        type: "object",
        required: ["email", "otp", "newPassword"],
        properties: {
          email: { type: "string", format: "email" },
          otp: { type: "string", example: "123456" },
          newPassword: { type: "string", minLength: 6 },
        },
      },
      Service: {
        type: "object",
        properties: {
          name: { type: "string", example: "Haircut" },
          price: { type: "number", example: 150 },
          durationMin: { type: "number", example: 30 },
          durationMax: { type: "number", example: 45 },
          isActive: { type: "boolean", example: true },
        },
      },
      WorkingHours: {
        type: "object",
        properties: {
          start: { type: "string", example: "09:00" },
          end: { type: "string", example: "22:00" },
        },
      },
      Store: {
        type: "object",
        properties: {
          _id: { type: "string" },
          owner: {
            oneOf: [{ type: "string" }, { $ref: "#/components/schemas/UserPublic" }],
          },
          storeName: { type: "string" },
          storeType: { type: "string", enum: ["barbershop", "beautySalon"] },
          location: { type: "string" },
          phone: { type: "string", nullable: true },
          bio: { type: "string", nullable: true },
          logo: { type: "string", nullable: true },
          services: {
            type: "array",
            items: { $ref: "#/components/schemas/Service" },
          },
          workingHours: { $ref: "#/components/schemas/WorkingHours" },
          offDays: { type: "array", items: { type: "string" } },
          receptionists: {
            type: "array",
            items: {
              oneOf: [{ type: "string" }, { $ref: "#/components/schemas/UserPublic" }],
            },
          },
          stylists: {
            type: "array",
            items: {
              oneOf: [{ type: "string" }, { $ref: "#/components/schemas/UserPublic" }],
            },
          },
          isOpen: { type: "boolean" },
          status: { type: "string", enum: ["ACTIVE", "SUSPENDED"] },
          approvalStatus: {
            type: "string",
            enum: ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"],
          },
        },
      },
      CreateStoreRequest: {
        type: "object",
        required: ["storeName", "storeType", "location"],
        properties: {
          storeName: { type: "string", example: "TurnUP Downtown" },
          storeType: { type: "string", enum: ["barbershop", "beautySalon"] },
          location: { type: "string", example: "Cairo, Egypt" },
          phone: { type: "string", example: "+20123456789" },
          bio: { type: "string", example: "Premium grooming services." },
          logo: { type: "string", example: "https://example.com/logo.png" },
          services: {
            type: "array",
            items: { $ref: "#/components/schemas/Service" },
          },
          workingHours: { $ref: "#/components/schemas/WorkingHours" },
          offDays: { type: "array", items: { type: "string" } },
        },
      },
      StoreResponse: {
        type: "object",
        properties: {
          message: { type: "string" },
          store: { $ref: "#/components/schemas/Store" },
        },
      },
      AddStylistRequest: {
        type: "object",
        required: ["stylistId"],
        properties: {
          stylistId: { type: "string", example: "6801234567890abcdef1234" },
        },
      },
      AddReceptionistRequest: {
        type: "object",
        required: ["receptionistId"],
        properties: {
          receptionistId: { type: "string", example: "6801234567890abcdef1234" },
        },
      },
    },
  },
  paths: {
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "User registered",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RegisterResponse" },
              },
            },
          },
          400: {
            description: "Validation error or user exists",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          403: {
            description: "Cannot self-register as admin",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          500: {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Login successful",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginResponse" },
              },
            },
          },
          400: {
            description: "Invalid credentials",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          500: {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/auth/profile": {
      get: {
        tags: ["Auth"],
        summary: "Get current user profile",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Profile data",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UserPublic" },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          404: {
            description: "User not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          500: {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/auth/update-password": {
      put: {
        tags: ["Auth"],
        summary: "Update password",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdatePasswordRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Password updated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Password updated successfully" },
                  },
                },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          404: {
            description: "User not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          500: {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/auth/forgot-password": {
      post: {
        tags: ["Auth"],
        summary: "Generate and send OTP",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ForgotPasswordRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "OTP sent",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "OTP sent to your email" },
                  },
                },
              },
            },
          },
          404: {
            description: "Account not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          500: {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/auth/verify-otp": {
      post: {
        tags: ["Auth"],
        summary: "Verify OTP",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/VerifyOtpRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "OTP valid",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "OTP verified successfully" },
                  },
                },
              },
            },
          },
          400: {
            description: "Invalid or expired OTP",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          404: {
            description: "Account not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          500: {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/auth/reset-password": {
      post: {
        tags: ["Auth"],
        summary: "Reset password with OTP",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ResetPasswordRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Password reset successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Password reset successfully" },
                  },
                },
              },
            },
          },
          400: {
            description: "Invalid or expired OTP",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          404: {
            description: "Account not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          500: {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/store/create": {
      post: {
        tags: ["Store"],
        summary: "Create store",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateStoreRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Store created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StoreResponse" },
              },
            },
          },
          400: {
            description: "Store already exists",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          403: {
            description: "Forbidden role",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          500: {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/store/profile": {
      get: {
        tags: ["Store"],
        summary: "Get store profile for logged-in provider/admin",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Store details",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Store" },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          403: {
            description: "Forbidden role",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          404: {
            description: "Store not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          500: {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/store/update": {
      put: {
        tags: ["Store"],
        summary: "Update store",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateStoreRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Store updated",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StoreResponse" },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          403: {
            description: "Forbidden role",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          404: {
            description: "Store not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          500: {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/store/add-stylist": {
      post: {
        tags: ["Store"],
        summary: "Add stylist to store",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AddStylistRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Stylist added",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Stylist added successfully" },
                  },
                },
              },
            },
          },
          400: {
            description: "Stylist already exists in store",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          403: {
            description: "Forbidden role",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          404: {
            description: "User or store not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          500: {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/store/add-receptionist": {
      post: {
        tags: ["Store"],
        summary: "Add receptionist to store",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AddReceptionistRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Receptionist added",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Receptionist added successfully" },
                  },
                },
              },
            },
          },
          400: {
            description: "Receptionist already exists in store",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          403: {
            description: "Forbidden role",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          404: {
            description: "User or store not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          500: {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/store/stylists": {
      get: {
        tags: ["Store"],
        summary: "Get all stylists in store",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Stylists list",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/UserPublic" },
                },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          403: {
            description: "Forbidden role",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          404: {
            description: "Store not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          500: {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/store/receptionists": {
      get: {
        tags: ["Store"],
        summary: "Get all receptionists in store",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Receptionists list",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/UserPublic" },
                },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          403: {
            description: "Forbidden role",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          404: {
            description: "Store not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          500: {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
  },
};

const setupSwagger = (app) => {
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  app.get("/docs.json", (req, res) => {
    res.json(swaggerDocument);
  });
};

module.exports = setupSwagger;
