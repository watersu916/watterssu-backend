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
    title: 'ZeroTrust 기반 내부 접근 제어 플랫폼 구축',
    subtitle: '승인 기반 임시 권한 관리 및 Teleport 기반 단일 통제 접속 체계 검증',
    summary: '임시 권한 승인/자동 회수 플랫폼을 구축하고, 서버와 쿠버네티스 접근 경로를 Teleport로 단일화했습니다. 감사 로그와 명령어 입력 단위의 세션 레코딩을 AWS 인프라(DynamoDB, S3)에 적재하여 강력한 사후 추적 능력을 검증했습니다.',
    tags: ['Teleport', 'Kubernetes', 'ArgoCD', 'Terraform', 'Prometheus'],
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
    title: '온프레미스 멀티 서버에서 쿠버네티스 전환',
    subtitle: '온-프레미스 기반 3 Tier 인프라의 선언적 전환 경험',
    summary: 'Vagrant VM 기반 8대의 온프레미스 멀티 서버를 수동으로 운영하면서 설정 파편화와 휴먼 에러가 빈번히 발생했고, 리소스 분리를 위해 물리 대역을 직접 격리해 구조적 비용과 관리 복잡성이 컸습니다. 이를 해결하기 위해 8대의 서버와 5개 대역을 네임스페이스와 NetworkPolicy 기반 논리 제어로 추상화했습니다. Ingress, Deployment, StatefulSet, PVC 등을 사용해 전체 구성을 코드로 자동화하고 컨트롤러 패턴 기반의 자가 치유 가용성을 구축했습니다.',
    tags: ['Rocky Linux', 'Kubernetes', 'Docker', 'Vagrant'],
    architecture: {
      nodes: [
        { id: 'client', label: '사용자 요청 (Client)', type: 'user' },
        { id: 'ingress', label: 'Ingress Controller (L7)', type: 'network' },
        { id: 'wordpress', label: 'WordPress Pods (Deployment)', type: 'service' },
        { id: 'mysql', label: 'MySQL Pod (StatefulSet)', type: 'service' },
        { id: 'netpol', label: 'NetworkPolicy (접근 격리)', type: 'tool' },
        { id: 'pvc_nfs', label: 'PVC (ReadWriteMany - NFS)', type: 'db' },
        { id: 'pvc_iscsi', label: 'PVC (ReadWriteOnce - iSCSI)', type: 'db' }
      ],
      connections: [
        { from: 'client', to: 'ingress', label: '트래픽 유입' },
        { from: 'ingress', to: 'wordpress', label: 'HTTP 라우팅' },
        { from: 'wordpress', to: 'netpol', label: '접근 규칙 통과' },
        { from: 'netpol', to: 'mysql', label: '안전한 DB 통신' },
        { from: 'wordpress', to: 'pvc_nfs', label: '소스코드 다중 마운트' },
        { from: 'mysql', to: 'pvc_iscsi', label: '데이터 단독 마운트' }
      ]
    }
  },
  {
    id: 'onprem-3tier-infra',
    title: '3-Tier Web/WAS Infrastructure 구축',
    subtitle: 'Rocky Linux 기반 고가용성(HA) 3-Tier 엔터프라이즈 인프라 아키텍처 구축',
    summary: '단일 서버 환경에서는 장애 발생 시 서비스가 중단되고, 스토리지와 애플리케이션이 강하게 결합되어 확장성과 운영 효율이 떨어지는 문제가 있었습니다. 이를 해결하기 위해 DNS, Load Balancer, Web Cluster, NAS(NFS), SAN(NVMe/TCP), Database를 계층별로 분리하여 고가용성과 확장성을 갖춘 Enterprise Linux 기반 3-Tier 인프라를 설계·구축했습니다.',
    tags: ['Rocky Linux', 'Apache', 'HAProxy', 'MariaDB', 'NFS'],
    architecture: {
      nodes: [],
      connections: []
    }
  },
  {
    id: 'collab-whiteboard',
    title: 'AI Agent 기반 구인 · 구직 자동화 플랫폼 구축',
    subtitle: 'OCR · STT 기반 시니어 맞춤형 구인 구직 플랫폼',
    summary: '은퇴 후 일상에 활력과 외출의 요소를 주는 소일거리를 가장 쉽게 연결하고자 구축된 AI Agent 기반 구인 · 구직 자동화 플랫폼 \'일로와 (iIlowa)\'입니다. 이미지 촬영(OCR)과 음성 발화(STT) 결합형 공고 자동화 및 AI 에이전트 맞춤 추천 기술을 융합하여 JIT(Just-In-Time) 시니어 매칭 생태계를 구현했습니다.',
    tags: ['FastAPI', 'PostgreSQL', 'Docker', 'Clova OCR/STT', 'LLM', 'React'],
    architecture: {
      nodes: [
        { id: 'client', label: 'Client (React 웹앱 / PC·모바일)', type: 'user' },
        { id: 'dns', label: 'DNS (Naver Cloud DNS / ilowa.site)', type: 'network' },
        { id: 'ingress', label: 'API Gateway / Load Balancer', type: 'network' },
        { id: 'frontend', label: 'watterssu-frontend (React 웹앱)', type: 'service' },
        { id: 'backend', label: 'backend_api (FastAPI 백엔드)', type: 'service' },
        { id: 'db', label: 'db (PostgreSQL + PostGIS + pgvector)', type: 'db' },
        { id: 'storage', label: '로컬 스토리지 (/media)', type: 'db' },
        { id: 'ai', label: '외부 AI 서비스 (Clova OCR/STT, OpenAI API)', type: 'tool' }
      ],
      connections: [
        { from: 'client', to: 'dns', label: 'HTTPS Request' },
        { from: 'dns', to: 'ingress', label: 'Route (ilowa.site)' },
        { from: 'ingress', to: 'frontend', label: 'Path: /' },
        { from: 'ingress', to: 'backend', label: 'Path: /api/*' },
        { from: 'backend', to: 'db', label: 'RAG / 데이터 쿼리' },
        { from: 'backend', to: 'storage', label: '공고 이미지/음성 서빙' },
        { from: 'backend', to: 'ai', label: 'OCR/STT/추천 분석' }
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
