FROM node:14-alpine
WORKDIR /app
COPY package*.json /app/
RUN npm install -g nodemon
RUN npm install 
COPY . /app/
CMD ["npm start"]
EXPOSE 3000