import { useNavigate } from 'react-router-dom';
import { SubmissionForm } from '../components/SubmissionForm';

export function SubmitPage() {
  const navigate = useNavigate();
  return (
    <div className="container" style={{ maxWidth: 680 }}>
      <h1 className="page-title">✍️ 정보 신규 등록</h1>
      <p className="page-desc">
        가이드에 없는 새 장소나 새 소식(예: 학교 카페 운영 중단)을 알려 주세요. 매니저가 확인하고 승인하면 등록돼요.
        <br />
        이미 있는 장소의 정보가 바뀌었다면, 그 장소를 열고 오른쪽 위 <b>정보추가</b>를 눌러 주세요.
      </p>
      <div className="card" style={{ padding: 18 }}>
        <SubmissionForm kind="new" onDone={() => navigate('/')} />
      </div>
    </div>
  );
}
