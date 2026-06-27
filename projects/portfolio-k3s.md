# Cloud-Native GitOps Portfolio Cluster

본 프로젝트는 개인 포트폴리오 웹사이트를 확장성과 연속성을 가진 클라우드 네이티브 환경에 배포하기 위해 구축되었습니다. 단순한 정적 웹 호스팅을 넘어 실제 운영 레벨의 DevOps 방법론을 학습하고 적용하는 것을 목표로 설정했습니다.

## 🛠 주요 사용 기술
- **Frontend**: React (Vite), Tailwind CSS, Lucide Icons, React Markdown
- **Backend**: Node.js, Express, File System Storage
- **Infrastructure & Devops**: k3s (Lightweight Kubernetes), Docker, Traefik Ingress, ArgoCD, GitHub Actions

## 🏗 아키텍처 상세 설계

### 1. 컨테이너 아키텍처
프론트엔드와 백엔드를 독립된 컨테이너 이미지로 관리합니다.
- **Frontend Container**: Multi-stage 빌드를 통해 빌드 타임 의존성을 배제하고 배포 가벼움을 유지했습니다. 정적 자원은 `Nginx Alpine` 이미지를 기반으로 구동되며, 클라이언트 사이드 라우팅(SPA) 지원을 위한 Nginx 설정이 추가되었습니다.
- **Backend Container**: 경량 `Node.js Alpine` 이미지를 베이스로 구동하여 최소 메모리 공간만을 차지하도록 최적화했습니다.

### 2. Kubernetes (k3s) 배포 및 라우팅
로컬 k3s 클러스터 내에 네임스페이스를 독립시키고 아래의 객체들로 오케스트레이션합니다.
- **Deployments & Services**: 
  - `watterssu-frontend`: 2개의 레플리카로 구성하여 고가용성을 유지하고 로드 밸런싱을 수행합니다.
  - `watterssu-backend`: Express 서버를 위한 파드로 구성하며 방명록 저장을 위해 HostPath 기반 Persistent Volume을 연결해 데이터가 유실되지 않도록 구성했습니다.
- **Ingress Controller (Traefik)**:
  - k3s 내장 Traefik Ingress를 통해 단일 진입점을 구축했습니다.
  - `watterssu.com` 도메인으로 들어오는 트래픽 중 `/api` 경로를 제외한 모든 트래픽은 프론트엔드로, `/api`로 시작하는 트래픽은 백엔드 서비스로 자동 분기 처리됩니다.

### 3. GitOps Continuous Delivery 파이프라인
프로젝트 수정 요소를 지속적으로 반영하기 위해 **ArgoCD**를 이용한 선언적 배포 방식을 채택했습니다.
- `watterssu-infra` 레포지토리에 Kubernetes 선언 파일(YAML)을 저장합니다.
- ArgoCD가 `watterssu-gitops`에 정의된 Application 매니페스트에 따라 Git 저장소의 매니페스트 상태와 클러스터의 실제 상태를 지속적으로 비교(Reconciliation)하고, 변경 사항이 감지되면 자동으로 동기화(Sync)합니다.

---

## 📈 문제 해결 및 성과
- **CORS 이슈 해결**: 프론트엔드와 백엔드를 서로 다른 도메인으로 처리할 경우 브라우저 보안 제약이 발생했으나, k3s Ingress 레벨에서 단일 호스트 (`watterssu.com`) 하위에 서브패스 `/api`로 백엔드 라우팅을 구성함으로써 CORS 문제를 근본적으로 해결했습니다.
- **데이터 영속성 확보**: 컨테이너 재시작 시 사라지는 JSON 데이터를 보존하기 위해 Kubernetes `PersistentVolume` 및 `PersistentVolumeClaim` 설정을 적용하여 로컬 Node 디렉토리에 데이터를 저장하도록 보장했습니다.
