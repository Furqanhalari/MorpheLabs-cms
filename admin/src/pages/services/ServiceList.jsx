import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Tag, Space, Typography, Popconfirm, Tooltip, Switch, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const { Title } = Typography;

export default function ServiceList() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services'],
    queryFn:  () => api.get('/services').then(r => r.data),
  });

  const deleteMut = useMutation({
    mutationFn: id => api.delete(`/services/${id}`),
    onSuccess: () => { qc.invalidateQueries(['services']); message.success('Deleted'); },
  });

  const toggleMut = useMutation({
    mutationFn: id => api.patch(`/services/${id}/toggle`),
    onSuccess: () => qc.invalidateQueries(['services']),
  });

  const columns = [
    { title: '#', dataIndex: 'sortOrder', width: 60 },
    { title: 'Service', dataIndex: 'title', render: (t, r) => <a onClick={() => navigate(`/services/${r.id}`)}>{t}</a> },
    { title: 'Category', render: (_, r) => r.category?.name || '—' },
    { title: 'Portfolio Items', render: (_, r) => r._count?.portfolios ?? 0, align: 'center' },
    {
      title: 'Published', width: 110,
      render: (_, r) => (
        <Switch checked={r.isPublished} size="small"
          onChange={() => toggleMut.mutate(r.id)}
          checkedChildren="Live" unCheckedChildren="Draft" />
      ),
    },
    {
      title: 'Actions', width: 100,
      render: (_, r) => (
        <Space>
          <Tooltip title="Edit"><Button size="small" icon={<EditOutlined />} onClick={() => navigate(`/services/${r.id}`)} /></Tooltip>
          <Popconfirm title="Delete service?" onConfirm={() => deleteMut.mutate(r.id)} okButtonProps={{ danger: true }}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>Services</Title>
        <Space>
          <Button onClick={() => navigate('/services/portfolio')}>Portfolio Items</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/services/new')}>New Service</Button>
        </Space>
      </div>
      <Table columns={columns} dataSource={services} loading={isLoading} rowKey="id"
        pagination={false} />
    </div>
  );
}
