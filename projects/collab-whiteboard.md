# Real-time Collaborative Canvas Tool

본 프로젝트는 지리적으로 떨어져 있는 협업자들이 웹 브라우저를 통해 실시간으로 드로잉, 텍스트 입력, 메모장 붙이기 등의 작업을 동시에 진행할 수 있는 웹 기반 실시간 협업 서비스입니다.

## 🛠 주요 사용 기술
- **Frontend**: React, Canvas API, Socket.io-client
- **Backend**: Node.js, Express, Socket.io
- **Pub/Sub Layer**: Redis (Pub/Sub Adapter)
- **Database**: MongoDB (JSON Document Store)

## 🏗 아키텍처 상세 설계

### 1. 실시간 양방향 이벤트 통신 (WebSockets)
- HTTP의 단방향 통신 한계를 극복하고 실시간 마우스 실시간 궤적 및 그림 데이터를 전송하기 위해 WebSockets을 기본 프로토콜로 사용합니다.
- `Socket.io` 라이브러리를 채택하여 연결이 끊겼을 때의 자동 재연결(Auto-reconnect) 및 폴백(Polling) 메커니즘을 적용했습니다.

### 2. Redis Adapter를 통한 소켓 서버 수평 확장
단일 Node.js 서버로는 다수의 동시 접속자 소켓 연결을 감당하기 어려우므로, 서버를 분산시키고 Redis Pub/Sub을 활용했습니다.
- Nginx 로드밸런서를 통해 사용자 소켓은 `Socket Server Pod 1` 또는 `Pod 2`로 연결됩니다.
- Pod 1에 연결된 사용자의 마우스 움직임 이벤트는 Redis Pub/Sub 채널을 통해 즉시 Pod 2로 브로드캐스트되어, 다른 서버(Pod 2)에 붙어 있는 사용자 화면에도 끊김 없이 마우스 드로잉 흔적이 표시됩니다.

### 3. 디바운싱(Debouncing)을 통한 데이터베이스 쓰기 최적화
실시간 드로잉 이벤트가 발생할 때마다 데이터베이스에 드로잉 데이터를 저장하게 되면 엄청난 Write 부하가 발생합니다.
- 사용자가 그리기를 멈추고 1초간 이벤트가 발생하지 않을 때만 전체 캔버스 상태를 `MongoDB`에 비동기 저장하도록 디바운싱 필터를 적용했습니다. DB 쓰기 호출 횟수를 95% 이상 단축했습니다.

---

## 📈 문제 해결 및 성과
- **화면 깜빡임 및 그리기 지연 극복**: 드로잉 좌표를 실시간으로 받아 매번 React 상태를 전체 갱신(Re-render)할 때 발생하는 렌더링 지연을 극복하고자, 캔버스 레이어를 '임시 드로잉 레이어'와 '최종 벡터 레이어'로 분리하여 브라우저의 `requestAnimationFrame` 주기에 맞춰 효율적으로 그리도록 성능을 개선했습니다.
- **동시성 충돌 방지**: 두 명의 사용자가 동일한 개체를 동시에 조작(이동, 수정 등)할 때 발생하는 데이터 충돌을 처리하기 위해 Operational Transformation(OT) 개념의 간이 타임스탬프 기반 충돌 해결 규칙을 정의하고 적용했습니다.
