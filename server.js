const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// In-memory data for projects (loaded dynamically in frontend)
const projects = [
  {
    id: 'portfolio-k3s',
    title: 'Cloud-Native GitOps Portfolio Cluster',
    subtitle: 'Kubernetes (k3s) 기반 무중단 배포 포트폴리오 웹 인프라',
    summary: '본 포트폴리오 웹사이트를 위한 클라우드 네이티브 인프라스트럭처로, React 프론트엔드와 Express 백엔드를 컨테이너화하고 k3s(클래식 K8s 경량화) 클러스터에서 구동합니다. ArgoCD를 이용한 GitOps 지속적 배포(CD) 파이프라인을 구축하여 코드 변경 사항을 자동으로 감지하고 무중단 배포를 실현했습니다.',
    tags: ['k3s', 'ArgoCD', 'React', 'Tailwind CSS', 'Express', 'Docker', 'Nginx'],
    architecture: {
      nodes: [
        { id: 'client', label: 'Client (Web/Mobile Browser)', type: 'user' },
        { id: 'dns', label: 'DNS (watterssu.com)', type: 'network' },
        { id: 'ingress', label: 'Traefik Ingress Controller', type: 'network' },
        { id: 'frontend', label: 'watterssu-frontend Pods (React + Nginx)', type: 'service' },
        { id: 'backend', label: 'watterssu-backend Pods (Express Node.js)', type: 'service' },
        { id: 'git', label: 'GitHub Repository', type: 'git' },
        { id: 'argocd', label: 'ArgoCD (GitOps Controller)', type: 'tool' }
      ],
      connections: [
        { from: 'client', to: 'dns', label: 'HTTPS Request' },
        { from: 'dns', to: 'ingress', label: 'Route (54.180.188.192)' },
        { from: 'ingress', to: 'frontend', label: 'Path: /' },
        { from: 'ingress', to: 'backend', label: 'Path: /api/*' },
        { from: 'git', to: 'argocd', label: 'Sync Manifests' },
        { from: 'argocd', to: 'ingress', label: 'Deploy & Reconcile' },
        { from: 'argocd', to: 'frontend', label: 'Deploy & Reconcile' },
        { from: 'argocd', to: 'backend', label: 'Deploy & Reconcile' }
      ]
    }
  },
  {
    id: 'ecommerce-microservices',
    title: 'MSA E-Commerce Backend Platform',
    subtitle: '도메인 주도 설계(DDD) 기반 대용량 트래픽 대응 마이크로서비스 아키텍처',
    summary: 'Spring Boot와 Node.js로 구축된 전자상거래 백엔드 플랫폼입니다. 인증, 상품 카탈로그, 주문 처리, 결제 시스템을 독립적인 마이크로서비스로 분할하고 Kubernetes 클러스터 상에서 서비스 메시(Istio) 및 API Gateway를 통해 통신하도록 설계했습니다. Kafka를 통한 이벤트 기반 비동기 트랜잭션을 구현하여 서비스 간 결합도를 낮췄습니다.',
    tags: ['MSA', 'Kubernetes', 'Apache Kafka', 'Spring Boot', 'Node.js', 'PostgreSQL', 'Redis'],
    architecture: {
      nodes: [
        { id: 'client', label: 'Client App', type: 'user' },
        { id: 'gateway', label: 'Spring Cloud API Gateway', type: 'network' },
        { id: 'auth', label: 'Auth Service (OAuth2 / JWT)', type: 'service' },
        { id: 'catalog', label: 'Catalog Service (Product API)', type: 'service' },
        { id: 'order', label: 'Order Service (Saga Orchestrator)', type: 'service' },
        { id: 'payment', label: 'Payment Service', type: 'service' },
        { id: 'kafka', label: 'Apache Kafka Event Broker', type: 'network' },
        { id: 'redis', label: 'Redis Cache (Catalog & Session)', type: 'db' },
        { id: 'postgres', label: 'PostgreSQL Database (Per-service DB)', type: 'db' }
      ],
      connections: [
        { from: 'client', to: 'gateway', label: 'API Calls' },
        { from: 'gateway', to: 'auth', label: 'Validate Token' },
        { from: 'gateway', to: 'catalog', label: 'Route Request' },
        { from: 'gateway', to: 'order', label: 'Route Request' },
        { from: 'catalog', to: 'redis', label: 'Cache Read/Write' },
        { from: 'order', to: 'kafka', label: 'Publish "Order Created"' },
        { from: 'kafka', to: 'payment', label: 'Consume Event' },
        { from: 'payment', to: 'kafka', label: 'Publish "Payment Completed"' },
        { from: 'kafka', to: 'order', label: 'Consume & Complete Saga' },
        { from: 'auth', to: 'postgres', label: 'Query User' },
        { from: 'catalog', to: 'postgres', label: 'Query Products' },
        { from: 'order', to: 'postgres', label: 'Save Order State' }
      ]
    }
  },
  {
    id: 'collab-whiteboard',
    title: 'Real-time Collaborative Canvas Tool',
    subtitle: 'WebSocket 기반 실시간 벡터 드로잉 협업 플랫폼',
    summary: '여러 사용자가 동시에 접속하여 벡터 도형을 그리고 텍스트를 입력하며 실시간으로 의견을 공유할 수 있는 화이트보드 협업 툴입니다. WebSocket 프로토콜과 Node.js(Socket.io)를 활용하여 100ms 미만의 지연 시간(Latency)으로 상태를 동기화하며, Redis Adapter를 활용한 Pub/Sub 아키텍처로 소켓 서버를 수평 확장(Scale-out)할 수 있도록 설계했습니다.',
    tags: ['WebSockets', 'Socket.io', 'React', 'Node.js', 'Redis', 'MongoDB', 'Docker'],
    architecture: {
      nodes: [
        { id: 'user1', label: 'User A Browser', type: 'user' },
        { id: 'user2', label: 'User B Browser', type: 'user' },
        { id: 'lb', label: 'Load Balancer (Nginx)', type: 'network' },
        { id: 'socket1', label: 'Socket.io Server Pod 1', type: 'service' },
        { id: 'socket2', label: 'Socket.io Server Pod 2', type: 'service' },
        { id: 'redis', label: 'Redis Pub/Sub (Socket.io Adapter)', type: 'db' },
        { id: 'mongo', label: 'MongoDB (Canvas State Storage)', type: 'db' }
      ],
      connections: [
        { from: 'user1', to: 'lb', label: 'WebSocket Conn' },
        { from: 'user2', to: 'lb', label: 'WebSocket Conn' },
        { from: 'lb', to: 'socket1', label: 'Sticky Session Route' },
        { from: 'lb', to: 'socket2', label: 'Sticky Session Route' },
        { from: 'socket1', to: 'redis', label: 'Sync Event (Pub)' },
        { from: 'redis', to: 'socket2', label: 'Broadcast Event (Sub)' },
        { from: 'socket2', to: 'user2', label: 'Push Sync Event' },
        { from: 'socket1', to: 'mongo', label: 'Auto-save (Debounced)' }
      ]
    }
  }
];

// 1. Get all projects metadata
app.get('/api/projects', (req, res) => {
  res.json(projects.map(p => ({
    id: p.id,
    title: p.title,
    subtitle: p.subtitle,
    summary: p.summary,
    tags: p.tags
  })));
});

// 2. Get specific project's markdown content and architecture details
app.get('/api/projects/:id', (req, res) => {
  const project = projects.find(p => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  // Load markdown content from file
  const mdPath = path.join(__dirname, 'projects', `${project.id}.md`);
  fs.readFile(mdPath, 'utf8', (err, data) => {
    if (err) {
      // Fallback description if file doesn't exist
      return res.json({
        ...project,
        markdown: `# ${project.title}\n\n상세 설명 문서가 아직 작성되지 않았습니다.`
      });
    }
    res.json({
      ...project,
      markdown: data
    });
  });
});

// 3. Post contact submission
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required' });
  }

  const newMessage = {
    name,
    email,
    message,
    timestamp: new Date().toISOString()
  };

  const dataDir = path.join(__dirname, 'data');
  const filePath = path.join(dataDir, 'messages.json');

  // Ensure data directory exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Append message to file
  fs.readFile(filePath, 'utf8', (err, fileData) => {
    let messages = [];
    if (!err && fileData) {
      try {
        messages = JSON.parse(fileData);
      } catch (e) {
        messages = [];
      }
    }
    messages.push(newMessage);

    fs.writeFile(filePath, JSON.stringify(messages, null, 2), 'utf8', (writeErr) => {
      if (writeErr) {
        console.error('Error writing message:', writeErr);
        return res.status(500).json({ error: 'Failed to save message' });
      }
      res.json({ success: true, message: 'Message received successfully' });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});
