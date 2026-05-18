FROM node:20

WORKDIR /app

# Copy package.json files
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Copy source code
COPY backend ./backend
COPY frontend ./frontend

# Remove Windows node_modules if they were copied
RUN rm -rf ./backend/node_modules ./frontend/node_modules

# Install dependencies (will fetch Linux binaries for sqlite3)
RUN cd backend && npm install
# Rebuild sqlite3 for the Linux environment
RUN cd backend && npm rebuild sqlite3 --build-from-source
RUN cd frontend && npm install

# Build frontend
RUN cd frontend && npm run build

# Set environment variables for production
ENV NODE_ENV=production
ENV PORT=8080
ENV DATA_DIR=/data
ENV DB_PATH=/data/takeaway.db

# Expose port
EXPOSE 8080

# Start backend (which also serves the frontend now)
CMD ["node", "backend/server.js"]
