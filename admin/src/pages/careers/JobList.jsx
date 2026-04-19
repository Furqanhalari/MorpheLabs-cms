// JobList.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Tag, Space, Select, Typography, Popconfirm, Tooltip, message, Badge } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined, StopOutlined, TeamOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import dayjs from 'dayjs';

const { Title } = Typography;
const STATUS_COLOR = { DRAFT:'default', ACTIVE:'green', CLOSED:'red', EXPIRED:'orange' };

export const JobList = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['jobs', statusFilter],
    queryFn:  () => api.get('/careers', { params: { status: statusFilter } }).then(r => r.data),
  });

  const deleteMut  = useMutation({ mutationFn: id => api.delete(`/careers/${id}`),      onSuccess: () => { qc.invalidateQueries(['jobs']); message.success('Deleted'); } });
  const publishMut = useMutation({ mutationFn: id => api.patch(`/careers/${id}/publish`), onSuccess: () => { qc.invalidateQueries(['jobs']); message.success('Published'); } });
  const closeMut   = useMutation({ mutationFn: id => api.patch(`/careers/${id}/close`),   onSuccess: () => { qc.invalidateQueries(['jobs']); message.success('Closed'); } });

  const columns = [
    { title: 'Title',      dataIndex: 'title', width: 240, render: (t,r) => <a onClick={() => navigate(`/careers/${r.id}`)}>{t}</a> },
    { title: 'Department', dataIndex: 'department', width: 140 },
    { title: 'Type',       dataIndex: 'employmentType', width: 120, render: t => t?.replace(/_/g,' ') },
    { title: 'Location',   dataIndex: 'locationType', width: 100, render: t => <Tag>{t}</Tag> },
    { title: 'Status',     dataIndex: 'status', width: 100, render: s => <Tag color={STATUS_COLOR[s]}>{s}</Tag> },
    { title: 'Applications', width: 110, render: (_,r) => <Badge count={r._count?.applications} showZero style={{ background: '#00B4D8' }} /> },
    { title: 'Deadline',   dataIndex: 'applicationDeadline', width: 120, render: d => d ? dayjs(d).format('MMM D, YYYY') : 'Open' },
    {
      title: 'Actions', width: 180, fixed: 'right',
      render: (_,r) => (
        <Space>
          <Tooltip title="Edit"><Button size="small" icon={<EditOutlined />} onClick={() => navigate(`/careers/${r.id}`)} /></Tooltip>
          <Tooltip title="Applications"><Button size="small" icon={<TeamOutlined />} onClick={() => navigate(`/careers/${r.id}/applications`)} /></Tooltip>
          {r.status !== 'ACTIVE' && <Tooltip title="Publish"><Button size="small" icon={<CheckOutlined />} onClick={() => publishMut.mutate(r.id)} /></Tooltip>}
          {r.status === 'ACTIVE'  && <Tooltip title="Close"><Button size="small" icon={<StopOutlined />} onClick={() => closeMut.mutate(r.id)} /></Tooltip>}
          <Popconfirm title="Delete?" onConfirm={() => deleteMut.mutate(r.id)} okButtonProps={{ danger: true }}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>Job Listings</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/careers/new')}>New Listing</Button>
      </div>
      <Space style={{ marginBottom: 16 }}>
        <Select placeholder="Filter by status" allowClear style={{ width: 180 }} onChange={v => setStatusFilter(v || '')}
          options={['DRAFT','ACTIVE','CLOSED','EXPIRED'].map(s => ({ value: s, label: s }))} />
      </Space>
      <Table columns={columns} dataSource={data?.data} loading={isLoading} rowKey="id" scroll={{ x: 1000 }}
        pagination={{ total: data?.meta?.total, pageSize: 20 }} />
    </div>
  );
};

export default JobList;
