import { useQuery } from '@tanstack/react-query';
import { Row, Col, Card, Statistic, Typography, Tag, Table, Skeleton, Space } from 'antd';
import {
  FileTextOutlined, AppstoreOutlined, BriefcaseOutlined,
  TeamOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

const { Title, Text } = Typography;

const statCards = (data) => [
  { title: 'Total Posts',       value: data?.totalPosts,       icon: <FileTextOutlined />, color: '#00B4D8', href: '/blog/posts' },
  { title: 'Published Posts',   value: data?.publishedPosts,   icon: <FileTextOutlined />, color: '#52c41a', href: '/blog/posts?status=PUBLISHED' },
  { title: 'Active Services',   value: data?.publishedServices,icon: <AppstoreOutlined />, color: '#7C3AED', href: '/services' },
  { title: 'Open Positions',    value: data?.activeJobs,       icon: <BriefcaseOutlined />,color: '#faad14', href: '/careers' },
  { title: 'Total Applications',value: data?.totalApplications,icon: <TeamOutlined />,     color: '#ff4d4f', href: '/careers' },
];

const activityColumns = [
  { title: 'User',     dataIndex: 'user',     render: u => `${u?.firstName} ${u?.lastName}` },
  { title: 'Action',   dataIndex: 'action',   render: a => <Tag>{a}</Tag> },
  { title: 'Resource', dataIndex: 'resource' },
  { title: 'Time',     dataIndex: 'createdAt',render: t => dayjs(t).fromNow() },
];

export default function Dashboard() {
  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn:  () => api.get('/dashboard/stats').then(r => r.data),
    refetchInterval: 60_000,
  });

  const { data: activity, isLoading: actLoading } = useQuery({
    queryKey: ['dashboard-activity'],
    queryFn:  () => api.get('/dashboard/activity').then(r => r.data),
    refetchInterval: 60_000,
  });

  return (
    <div>
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>Dashboard</Title>
        <Text type="secondary">{dayjs().format('dddd, MMMM D, YYYY')}</Text>
      </div>

      {/* Stat Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statsLoading
          ? Array(5).fill(0).map((_, i) => <Col key={i} xs={24} sm={12} lg={8} xl={4}><Card><Skeleton active /></Card></Col>)
          : statCards(stats).map(s => (
            <Col key={s.title} xs={24} sm={12} lg={8} xl={4}>
              <Card
                className="stat-card" hoverable
                style={{ borderTop: `3px solid ${s.color}`, cursor: 'pointer' }}
                onClick={() => navigate(s.href)}
              >
                <Statistic
                  title={<Space>{s.icon}<span>{s.title}</span></Space>}
                  value={s.value ?? 0}
                  valueStyle={{ color: s.color }}
                />
              </Card>
            </Col>
          ))
        }
      </Row>

      <Row gutter={[16, 16]}>
        {/* Recent Applications */}
        <Col xs={24} lg={10}>
          <Card title={<><TeamOutlined /> Recent Applications</>}>
            {statsLoading ? <Skeleton active /> : (stats?.recentApplications || []).map(app => (
              <div key={app.id} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <Text strong>{app.firstName} {app.lastName}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>{app.job?.title} · {dayjs(app.createdAt).fromNow()}</Text>
              </div>
            ))}
          </Card>
        </Col>

        {/* Activity Log */}
        <Col xs={24} lg={14}>
          <Card title={<><ClockCircleOutlined /> Recent Activity</>}>
            <Table
              dataSource={activity}
              columns={activityColumns}
              loading={actLoading}
              rowKey="id"
              size="small"
              pagination={{ pageSize: 8, size: 'small' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
