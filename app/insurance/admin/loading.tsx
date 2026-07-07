import { Spin } from 'antd';

export default function InsuranceAdminLoading() {
  return (
    <div className="insurance-route-loading">
      <Spin size="large" />
      <span>Loading insurance admin...</span>
    </div>
  );
}
