# CATCH Music Streaming Backend

A production-ready, scalable music streaming backend built with industry-standard technologies including C++, Java, Python, Go, PostgreSQL, Cassandra, Kafka, and more.

## 🏗️ Architecture Overview

This backend system is designed to handle millions of users and high-throughput music streaming using a microservices architecture:

### 🔧 Technology Stack

**Backend Services:**

- **C++**: High-performance audio streaming service (WebSocket-based)
- **Java (Spring Boot)**: Core API service with REST endpoints
- **Python**: ML recommendation engine with scikit-learn
- **Go**: User management microservice with high concurrency

**Databases:**

- **PostgreSQL**: Primary database for structured data (users, tracks, playlists)
- **Cassandra**: Distributed database for time-series data (listening history, analytics)
- **Redis**: Caching layer and session storage

**Event Streaming:**

- **Apache Kafka**: Real-time event streaming and data pipeline
- **Zookeeper**: Kafka cluster coordination

**Infrastructure:**

- **Docker**: Containerization for all services
- **Nginx**: Load balancer and API gateway
- **Prometheus**: Metrics collection
- **Grafana**: Monitoring dashboards

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- At least 8GB RAM available
- 20GB free disk space

### 1. Clone and Setup

```bash
# Navigate to backend directory
cd backend

# Make scripts executable
chmod +x kafka/setup-topics.sh
chmod +x kafka/monitoring/kafka-monitor.py
```

### 2. Start Infrastructure Services

```bash
# Start databases and messaging first
docker-compose up -d postgres redis zookeeper kafka cassandra

# Wait for services to be ready (about 2-3 minutes)
docker-compose ps

# Setup Kafka topics
docker-compose up kafka-setup
```

### 3. Start Application Services

```bash
# Start all application services
docker-compose up -d core-api user-service ml-service streaming-service

# Start monitoring and management tools
docker-compose up -d prometheus grafana kafka-ui nginx adminer redis-commander
```

### 4. Verify Deployment

```bash
# Check all services are running
docker-compose ps

# Test API endpoints
curl http://localhost/api/v1/tracks
curl http://localhost/api/v1/users
curl http://localhost:8000/health
```

## 📊 Service Endpoints

### Core API Service (Port 8080)

- **Base URL**: `http://localhost/api/v1`
- **Health**: `http://localhost:8080/actuator/health`
- **Metrics**: `http://localhost:8080/actuator/metrics`

**Key Endpoints:**

- `GET /api/v1/tracks` - Get tracks
- `POST /api/v1/tracks/{id}/play` - Record track play
- `GET /api/v1/tracks/search` - Search tracks
- `GET /api/v1/tracks/trending` - Get trending tracks
- `POST /api/v1/tracks/{id}/like` - Like/unlike track

### User Service (Port 8081)

- **Base URL**: `http://localhost/api/v1/users`
- **Health**: `http://localhost:8081/health`

**Key Endpoints:**

- `POST /api/v1/users` - Create user
- `GET /api/v1/users/{id}` - Get user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/users/{id}/follow` - Follow user

### ML Recommendation Service (Port 8000)

- **Base URL**: `http://localhost:8000`
- **Health**: `http://localhost:8000/health`

**Key Endpoints:**

- `POST /recommendations` - Get personalized recommendations
- `POST /similar-tracks` - Get similar tracks
- `POST /user-interaction` - Record user interaction

### Streaming Service (Port 9001)

- **WebSocket**: `ws://localhost:9001`
- **Health**: `http://localhost:9001/health`

## 🔍 Management Interfaces

### Monitoring Dashboards

- **Grafana**: http://localhost:3000 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Kafka UI**: http://localhost:8090

### Database Management

- **Adminer**: http://localhost:8082 (PostgreSQL management)
- **Redis Commander**: http://localhost:8083 (Redis management)

## 📊 Database Schemas

### PostgreSQL Schema

Located in `database/postgresql/init.sql`, includes:

- Users and authentication
- Tracks, albums, artists
- Playlists and social features
- Analytics and reporting tables

### Cassandra Schema

Located in `database/cassandra/schema.cql`, includes:

- Time-series listening history
- Real-time analytics
- User behavior tracking
- Trending data by location

## 🔄 Event Streaming with Kafka

### Topic Structure

High-throughput topics:

- `user-plays` - Track play events
- `streaming-events` - Real-time streaming
- `user-activity` - User actions
- `track-popularity` - Popularity updates

Medium-throughput topics:

- `user-social` - Social interactions
- `track-interactions` - Likes, shares
- `playlist-events` - Playlist operations
- `recommendation-events` - ML events

### Monitoring Kafka

```bash
# Run Kafka monitoring script
python kafka/monitoring/kafka-monitor.py --mode monitor

# Check topic health
python kafka/monitoring/kafka-monitor.py --mode report
```

## 🔧 Configuration

### Environment Variables

**Core API Service:**

```env
DATABASE_URL=jdbc:postgresql://postgres:5432/catch_music
REDIS_HOST=redis
KAFKA_BOOTSTRAP_SERVERS=kafka:9092
```

**User Service:**

```env
DATABASE_URL=postgres://catch_user:catch_password@postgres:5432/catch_music
REDIS_ADDR=redis:6379
KAFKA_BROKERS=kafka:9092
```

**ML Service:**

```env
POSTGRES_HOST=postgres
REDIS_HOST=redis
```

### Scaling Services

```bash
# Scale core API service
docker-compose up -d --scale core-api=3

# Scale user service
docker-compose up -d --scale user-service=2
```

## 📈 Performance Tuning

### Database Optimization

- PostgreSQL configured with optimized settings for OLTP workloads
- Cassandra tuned for time-series data with appropriate compaction strategies
- Redis configured with LRU eviction and persistence

### Kafka Optimization

- Topics configured with appropriate partitions and replication
- Compression enabled (LZ4) for network efficiency
- Retention policies optimized for different data types

### Application Performance

- Java service uses G1GC and container-aware JVM settings
- Go service compiled with CGO for PostgreSQL driver performance
- Python service uses async operations for database queries
- C++ service optimized for low-latency audio streaming

## 🔒 Security Features

- Non-root containers for all services
- SSL/TLS configuration ready for Kafka
- Database connection encryption
- Input validation and SQL injection prevention
- Rate limiting and request quotas

## ��� Troubleshooting

### Common Issues

**Services not starting:**

```bash
# Check logs
docker-compose logs -f [service-name]

# Restart specific service
docker-compose restart [service-name]
```

**Database connection issues:**

```bash
# Check database is ready
docker-compose exec postgres pg_isready -U catch_user

# Check Redis connectivity
docker-compose exec redis redis-cli ping
```

**Kafka topics not created:**

```bash
# Manually run topic setup
docker-compose exec kafka /scripts/setup-topics.sh
```

### Health Checks

All services include health check endpoints:

```bash
# Check all service health
curl http://localhost:8080/actuator/health
curl http://localhost:8081/health
curl http://localhost:8000/health
curl http://localhost:9001/health
```

## 📚 API Documentation

### OpenAPI/Swagger

- Core API: http://localhost:8080/swagger-ui.html
- ML Service: http://localhost:8000/docs

### Example Requests

**Create User:**

```bash
curl -X POST http://localhost/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "musiclover",
    "display_name": "Music Lover",
    "password": "secure-password"
  }'
```

**Play Track:**

```bash
curl -X POST http://localhost/api/v1/tracks/550e8400-e29b-41d4-a716-446655440030/play \
  -H "User-ID: 550e8400-e29b-41d4-a716-446655440001"
```

**Get Recommendations:**

```bash
curl -X POST http://localhost:8000/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "550e8400-e29b-41d4-a716-446655440001",
    "num_recommendations": 20
  }'
```

## 🚢 Production Deployment

### Cloud Deployment (GCP/AWS)

1. Use managed databases (Cloud SQL, DynamoDB)
2. Configure Kafka with managed services (Confluent Cloud, MSK)
3. Use container orchestration (Kubernetes, ECS)
4. Implement proper secrets management
5. Configure load balancers and auto-scaling

### Monitoring in Production

- Set up alerting rules in Prometheus
- Configure log aggregation (ELK stack)
- Implement distributed tracing
- Monitor business metrics and KPIs

## 🤝 Contributing

1. Follow the existing code structure
2. Add tests for new features
3. Update documentation
4. Ensure Docker builds succeed
5. Test with the full stack

## 📄 License

This project is designed for educational and demonstration purposes, showcasing enterprise-grade music streaming architecture patterns.
