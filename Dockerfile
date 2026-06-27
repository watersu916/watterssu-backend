FROM node:20-alpine

WORKDIR /usr/src/app

# Copy package info and install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy server code and markdown folder
COPY server.js ./
COPY projects/ ./projects/

# Create directory for contact messages volume mount
RUN mkdir -p data

EXPOSE 5001

ENV PORT=5001
ENV NODE_ENV=production

CMD ["node", "server.js"]
