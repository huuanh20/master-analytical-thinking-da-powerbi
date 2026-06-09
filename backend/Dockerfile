# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build-env
WORKDIR /app

# Copy everything and restore
COPY . ./
RUN dotnet restore PowerBILearning.slnx

# Build and publish release
RUN dotnet publish src/4.WebApi/PowerBILearning.WebApi.csproj -c Release -o out

# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build-env /app/out .

# Expose port (Render/Fly.io default is port 8080 for C#)
EXPOSE 8080
ENV ASPNETCORE_URLS=http://*:8080

ENTRYPOINT ["dotnet", "PowerBILearning.WebApi.dll"]
