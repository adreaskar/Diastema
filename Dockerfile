FROM node:14-alpine
WORKDIR /app
COPY package*.json /app/
RUN npm install -g nodemon
RUN npm install mongodb
RUN npm install 
COPY . /app/
CMD ["nodemon"]
EXPOSE 3000