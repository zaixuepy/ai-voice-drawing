FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./backend/
RUN cd backend && npm install

COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

RUN mkdir -p frontend/public/fonts && \
    cp -r frontend/node_modules/@excalidraw/excalidraw/dist/prod/fonts/* frontend/public/fonts 2>/dev/null || true

COPY frontend/ ./frontend/
RUN cd frontend && npm run build

COPY backend/ ./backend/

RUN cp -r frontend/dist backend/public

EXPOSE 3000
ENV NODE_ENV=production

CMD ["node", "backend/server.js"]
