import { Alert, Spin } from 'antd';

export default function InsuranceAdminLoading() {
  return (
    <div className="insurance-route-loading">
      <Alert
        type="info"
        showIcon
        icon={<Spin size="small" />}
        message="Loading insurance admin"
        description="Checking authentication, configuration, and case data."
      />
    </div>
  );
}
