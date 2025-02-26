import { Hono, serve } from "../deps.ts";
import { cors } from "../deps.ts";
import { logger } from "../deps.ts";
import { healthRoutes } from "./routes/health.ts";

/**
 * Represents a standardized API response structure.
 *
 * @typeparam T - The type of the data payload.
 */
type ApiResponse<T> = {
  /**
   * Metadata about the response.
   */
  meta: {
    /**
     * The timestamp when the response was generated.
     */
    timestamp: string;
    /**
     * A unique identifier for the request.
     */
    requestId: string;
  };
  /**
   * The data payload of the response.
   */
  data: T;
};

/**
 * Augments the global `ImportMeta` interface to include a `main` property.
 * This is a custom property, non standard for Deno.
 * This is used to identify if the current module is the main entry point.
 */
declare global {
  interface ImportMeta {
    /**
     * Indicates if the current module is the main entry point of the application.
     */
    main: boolean;
  }
}

/**
 * Creates and configures an instance of the Hono application.
 * This function sets up middleware, error handling, and routes.
 *
 * @returns A configured Hono application instance.
 */
export function createApp(): Hono {
  const app = new Hono();

  /**
   * Middleware for logging request details.
   *
   * This middleware logs information about each incoming request,
   * including the method, URL, headers, and request path.
   * It also adds a unique request ID to the response headers.
   */
  app.use('*', async (c, next) => {
    const requestId = crypto.randomUUID();
    console.log(`[${requestId}] Incoming request:`, {
      method: c.req.method,
      url: c.req.url,
      headers: Object.fromEntries(c.req.headers.entries()),
      path: new URL(c.req.url).pathname.trim(),
    });

    // Add request ID to response headers
    c.res.headers.set('X-Request-ID', requestId);
    await next();
  });

  /**
   * Middleware for logging and CORS.
   *
   * - `logger()`: Logs requests in a standard format.
   * - `cors()`: Enables Cross-Origin Resource Sharing with the specified options.
   */
  app.use('*', logger());
  app.use('*', cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Accept'],
    exposeHeaders: ['X-Request-ID'],
  }));

  /**
   * Middleware for tracking and adding response time.
   *
   * This middleware measures the time it takes to process a request
   * and adds the response time to the `X-Response-Time` header.
   */
  app.use('*', async (c, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    c.res.headers.set('X-Response-Time', `${ms}ms`);
  });

  /**
   * Global error handler middleware.
   *
   * This middleware handles any errors that occur during request processing.
   * It logs the error and returns a standardized error response to the client.
   */
  app.onError((err, c) => {
    const requestId = c.res.headers.get('X-Request-ID');
    console.error(`[${requestId}] Error handling request:`, err);
    return c.json({
      error: 'Internal Server Error',
      message: err.message,
      requestId
    }, 500);
  });

  /**
   * 404 (Not Found) handler middleware.
   *
   * This middleware handles requests that do not match any defined routes.
   * It logs the 404 error and returns a standardized "Not Found" response to the client.
   */
  app.notFound((c) => {
    const requestId = c.res.headers.get('X-Request-ID');
    const path = new URL(c.req.url).pathname.trim();
    console.log(`[${requestId}] 404 Not Found for path: "${path}"`);
    return c.json({
      error: 'Not Found',
      message: `No route found for ${c.req.method} ${path}`,
      requestId
    }, 404);
  });

  /**
   * Mounts the health routes to the application.
   *
   * All routes defined in `healthRoutes` will be available under the "/health" path.
   */
  app.route("/health", healthRoutes);

  return app;
}

/**
 * Entry point for the server application when run directly.
 *
 * This code block is executed only when the script is run as the main module,
 * not when it's imported by another module. It sets up the server's configuration,
 * starts the server, and handles server-level events like listening and errors.
 */
if (import.meta.main) {
  const app = createApp();
  const port = parseInt(Deno.env.get("PORT") || "8000");

  console.log('\n=== Server Configuration ===');
  console.log('Environment:', Deno.env.get('DENO_ENV') || 'development');
  console.log('Port:', port);
  console.log('===========================\n');

  console.log('Starting server...');

  await serve(app.fetch, {
    port,
    hostname: '0.0.0.0',
    /**
     * Callback function triggered when the server starts listening.
     *
     * @param param0 - An object containing the port and hostname of the server.
     */
    onListen: ({ port, hostname }) => {
      console.log('\n==== Server is Running! ====');
      console.log(`Local URL: http://${hostname}:${port}`);
      console.log('===========================\n');
    },
    /**
     * Callback function triggered when an error occurs during server operation.
     *
     * @param error - The error that occurred.
     */
    onError: (error) => {
      console.error('Server error:', error);
    },
  });
}
