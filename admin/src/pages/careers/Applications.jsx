import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table, Button, Tag, Select, Space, Typography, Card,
  Drawer, Descriptions, message, Avatar, Tooltip,
} from 'antd';
import { ArrowLeftOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import api from '../../services/api';
import dayjs from 'dayjs';

const { Title, Text, Link } = Typography;

const STATUS_COLOR = {
  SUBMITTED: 'blue', REVIEWED: 'orange', SHORTLISTED: 'green',
  REJECTED: 'red', HIRED: 'purple',
};

export default function Applications() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: job } = useQuery({
    queryKey: ['job', id],
    queryFn:  () => api.get(`/careers/${id}`).then(r => r.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['applications', id, statusFilter],
    queryFn:  () => api.get(`/careers/${id}/applications`, { params: { status: statusFilter } }).then(r => r.data),
  });

  const updateMut = useMutation({
    mutationFn: ({ appId, status }) => api.patch(`/careers/applications/${appId}/status`, { status }),
    onSuccess: () => { qc.invalidateQueries(['applications']); message.success('Status updated'); },
  });

  const columns = [
    {
      title: 'Applicant', width: 200,
      render: (_, r) => (
        <Space>
          <Avatar style={{ background: '#00B4D8' }}>{r.firstName[0]}{r.lastName[0]}</Avatar>
          <div>
            <div style={{ fontWeight: 600 }}>{r.firstName} {r.lastName}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>{r.email}</Text>
          </div>
        </Space>
      ),
    },
    { title: 'Phone', dataIndex: 'phone', width: 140, render: p => p || '—' },
    {
      title: 'Status', dataIndex: 'status', width: 140,
      render: (s, r) => (
        <Select
          value={s} size="small" style={{ width: 130 }}
          onChange={val => updateMut.mutate({ appId: r.id, status: val })}
          options={Object.keys(STATUS_COLOR).map(k => ({ value: k, label: <Tag color={STATUS_COLOR[k]}>{k}</Tag> }))}
        />
      ),
    },
    {
      title: 'Resume', width: 100,
      render: (_, r) => (
        <Tooltip title="Download Resume">
          <Button size="small" icon={<DownloadOutlined />}
            href={r.resumeUrl} target="_blank" rel="noopener noreferrer" />
        </Tooltip>
      ),
    },
    { title: 'Applied', dataIndex: 'createdAt', width: 120, render: d => dayjs(d).format('MMM D, YYYY') },
    {
      title: 'Actions', width: 80,
      render: (_, r) => (
        <Button size="small" icon={<EyeOutlined />}
          onClick={() => { setSelected(r); setDrawerOpen(true); }}>View</Button>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/careers')} />
          <div>
            <Title level={3} style={{ margin: 0 }}>Applications</Title>
            <Text type="secondary">{job?.title}</Text>
          </div>
        </Space>
        <Select
          placeholder="Filter by status" allowClear style={{ width: 160 }}
          onChange={v => setStatusFilter(v || '')}
          options={Object.keys(STATUS_COLOR).map(k => ({ value: k, label: k }))}
        />
      </div>

      <Card>
        <Table
          columns={columns} dataSource={data?.data} loading={isLoading}
          rowKey="id" scroll={{ x: 800 }}
          pagination={{ total: data?.meta?.total, pageSize: 50 }}
        />
      </Card>

      {/* Application detail drawer */}
      <Drawer
        title={`${selected?.firstName} ${selected?.lastName}`}
        open={drawerOpen} onClose={() => setDrawerOpen(false)}
        width={480}
      >
        {selected && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Email">{selected.email}</Descriptions.Item>
            <Descriptions.Item label="Phone">{selected.phone || '—'}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={STATUS_COLOR[selected.status]}>{selected.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="LinkedIn">
              {selected.linkedInUrl ? <Link href={selected.linkedInUrl} target="_blank">View Profile</Link> : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Portfolio">
              {selected.portfolioUrl ? <Link href={selected.portfolioUrl} target="_blank">View Portfolio</Link> : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Resume">
              <Button size="small" icon={<DownloadOutlined />} href={selected.resumeUrl} target="_blank">Download PDF</Button>
            </Descriptions.Item>
            <Descriptions.Item label="Cover Letter">
              <div style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{selected.coverLetter || 'Not provided'}</div>
            </Descriptions.Item>
            <Descriptions.Item label="Applied">
              {dayjs(selected.createdAt).format('MMM D, YYYY [at] h:mm A')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  );
}
