import { useQuery } from '@tanstack/react-query';
import { Table, Tag, Typography, Card } from 'antd';
import api from '../services/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

const { Title, Text } = Typography;

const ACTION_COLORS = {
  CREATE:'green', UPDATE:'blue', DELETE:'red', PUBLISH:'purple',
  UNPUBLISH:'orange', LOGIN:'cyan', LOGOUT:'default',
  PASSWORD_CHANGED:'red', LOGIN_FAILED:'red',
};

export default function AuditLog() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-log'],
    queryFn:  () => api.get('/dashboard/activity').then(r => r.data),
    refetchInterval: 30_000,
  });

  const columns = [
    {
      title: 'User', width: 180,
      render: (_, r) => r.user ? `${r.user.firstName} ${r.user.lastName}` : '—',
    },
    {
      title: 'Action', dataIndex: 'action', width: 160,
      render: a => {
        const base = a?.split('_')[0];
        return <Tag color={ACTION_COLORS[base] || 'default'}>{a}</Tag>;
      },
    },
    { title: 'Resource', dataIndex: 'resource', width: 120 },
    { title: 'Resource ID', dataIndex: 'resourceId', width: 280, render: id => id ? <Text code style={{ fontSize: 11 }}>{id}</Text> : '—' },
    { title: 'IP Address', dataIndex: 'ipAddress', width: 120 },
    {
      title: 'Time', dataIndex: 'createdAt', width: 160,
      render: t => (
        <span title={dayjs(t).format('YYYY-MM-DD HH:mm:ss')}>
          {dayjs(t).fromNow()}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>Audit Log</Title>
        <Text type="secondary">Last 20 actions · Auto-refreshes every 30s</Text>
      </div>
      <Card>
        <Table
          columns={columns} dataSource={logs} loading={isLoading}
          rowKey="id" scroll={{ x: 1000 }}
          pagination={{ pageSize: 20 }}
        />
      </Card>
    </div>
  );
}
