
# First stage, build the frontend
FROM node:16

ENV FRONTEND=/opt/frontend
WORKDIR $FRONTEND

COPY package.json $FRONTEND
RUN npm install

COPY . $FRONTEND
RUN npm run build

# Second stage
FROM nginx:1.18.0

ENV HOME=/opt/app

WORKDIR $HOME

# Copy frontend from the first stage
COPY --from=0 /opt/frontend/dist dist
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]