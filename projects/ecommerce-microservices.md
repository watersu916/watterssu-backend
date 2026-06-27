# MSA E-Commerce Backend Platform

본 프로젝트는 단일 애플리케이션(Monolith)이 대용량 사용자 트래픽 상황에서 겪는 수평 확장성 한계와 서비스 간 장애 전파 문제를 극복하기 위해 설계된 마이크로서비스 아키텍처(MSA) 기반 플랫폼입니다.

## 🛠 주요 사용 기술
- **Backend Services**: Java, Spring Boot, Node.js (NestJS)
- **Infrastructure**: Kubernetes, Spring Cloud API Gateway, Consul (Service Discovery)
- **Event Messaging**: Apache Kafka, Kafka Connect
- **Databases**: PostgreSQL (Relational), Redis (Caching), MongoDB (Log Storage)

## 🏗 아키텍처 상세 설계

### 1. 서비스 분할 및 DB per Service
모든 서비스는 비즈니스 도메인(DDD)을 기준으로 완전히 분할되어 자체 데이터베이스를 소유합니다.
- **Auth Service**: 사용자 관리 및 OAuth2 / JWT 기반 토큰 발급 및 검증을 담당합니다.
- **Catalog Service**: 대규모 조회 성능을 극복하기 위해 상품 정보를 보관하며, `Redis` 캐싱 레이어를 적용해 데이터베이스 부하를 80% 이상 경감시켰습니다.
- **Order Service**: 주문 접수 및 Saga 패턴을 통한 분산 트랜잭션을 조정합니다.
- **Payment Service**: 결제 처리 및 PG사 연동 가상 프로세스를 담당합니다.

### 2. Spring Cloud Gateway & Service Discovery
- 외부 클라이언트는 단일 엔드포인트인 `API Gateway`를 통해서만 내부 서비스에 액세스합니다.
- `Consul` Service Discovery와 연계하여 서비스 인스턴스의 증감에 맞춰 동적으로 라우팅 경로를 업데이트하고 트래픽을 분산시킵니다.

### 3. Kafka를 활용한 비동기 이벤트 기반 아키텍처
주문과 결제 프로세스는 동기식 REST 호출 대신 Apache Kafka를 경유하는 비동기 메시징 형태로 동작합니다.
- 사용자가 주문 요청 시 Order Service는 데이터베이스에 주문 상태를 'PENDING'으로 기록하고, 즉시 Kafka에 `order.created` 이벤트를 발행합니다.
- Payment Service는 해당 이벤트를 구독하여 결제를 진행한 후 `payment.completed` 이벤트를 응답 발행합니다.
- Order Service가 이를 수신하여 주문 상태를 'COMPLETED'로 갱신합니다. 이를 통해 결제 서비스 다운 시에도 주문 접수가 정상 작동하는 장애 격리(Fault Isolation)를 확보했습니다.

---

## 📈 문제 해결 및 성과
- **데이터 일관성 유지 (Saga Pattern)**: 각 서비스가 고유 DB를 가짐으로써 발생하는 분산 트랜잭션 문제를 Kafka 기반 오케스트레이션 Saga 패턴으로 극복했습니다. 결제 실패 시 보상 트랜잭션(Compensating Transaction)을 실행하여 주문을 자동 취소하도록 설계했습니다.
- **대량의 상품 조회 병목 개선**: 읽기 요청이 많은 카탈로그 데이터를 Redis 캐시에 두고, 주기적으로 데이터베이스와 동기화(Write-behind 패턴)하도록 유도하여 응답 속도를 평균 300ms에서 25ms로 90% 이상 단축했습니다.
