FROM denoland/deno:latest

# Set the working directory
WORKDIR /app

# Copy dependency files
COPY deno.json* .

# Copy the rest of the application
COPY . .

# The port your application will listen on (adjust if needed)
EXPOSE 8000

# Command to run the application
CMD ["deno", "run", "--watch", "--allow-net", "--allow-env", "--allow-read", "src/server.ts"] 