# backend/Dockerfile
FROM alpine:3.20

ARG PB_VERSION=0.23.6
WORKDIR /pb

RUN apk add --no-cache ca-certificates wget unzip \
  && wget -q https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip -O /tmp/pb.zip \
  && unzip -q /tmp/pb.zip -d /pb \
  && rm -rf /tmp/pb.zip \
  && chmod +x /pb/pocketbase

# You'll mount a Railway Volume to /pb/pb_data (important)
EXPOSE 8080

CMD ["/pb/pocketbase","serve","--http=0.0.0.0:8080"]
