import { Spin } from 'antd';

export default function InsuranceShareLoading() {
  return (
    <div className="insurance-route-loading">
      <Spin size="large" />
      <span>Loading shared cases...</span>
    </div>
  );
}
