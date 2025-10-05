FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --production
COPY admin.js ./admin.js
COPY public ./public
ENV PORT=10000
EXPOSE 10000
CMD ["node", "admin.js"]
