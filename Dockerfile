FROM node:14-alpine
WORKDIR /app
COPY package*.json /app/
RUN npm install -g nodemon
RUN npm install mongodb
RUN npm install 
COPY . /app/
RUN mkdir -p /app/public/data
CMD ["nodemon"]
EXPOSE 3000