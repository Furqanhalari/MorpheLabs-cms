import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Tag, Space, Input, Select, Popconfirm, Typography, Tooltip, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, CheckCircleOutlined, StopOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Search } = Input;

const STATUS_COLORS = { PUBLISHED:'green', DRAFT:'orange', SCHEDULED:'blue', ARCHIVED:'default', PENDING_REVIEW:'purple' };

export default function PostList() {
  const [filters, setFilters] = useState({ status: '', search: '' });
  const [page,    setPage]    = useState(1);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['posts', filters, page],
    queryFn:  () => api.get('/', { baseURL: '/api/v1/blog', params: { ...filters, page, limit: 20 } }).then(r => r.data),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => api.delete(`/blog/${id}`),
    onSuccess:  () => { qc.invalidateQueries(['posts']); message.success('Post deleted'); },
  });

  const publishMut = useMutation({
    mutationFn: (id) => api.patch(`/blog/${id}/publish`),
    onSuccess:  () => { qc.invalidateQueries(['posts']); message.success('Post published'); },
  });

  const unpublishMut = useMutation({
    mutationFn: (id) => api.patch(`/blog/${id}/unpublish`),
    onSuccess:  () => { qc.invalidateQueries(['posts']); message.success('Post unpublished'); },
  });

  const columns = [
    { title: 'Title', dataIndex: 'title', ellipsis: true, width: 300,
      render: (t, r) => <a onClick={() => navigate(`/blog/posts/${r.id}`)}>{t}</a> },
    { title: 'Status', dataIndex: 'status', width: 120,
      render: s => <Tag color={STATUS_COLORS[s]}>{s}</Tag> },
    { title: 'Author', dataIndex: 'author', width: 140,
      render: a => `${a?.firstName} ${a?.lastName}` },
    { title: 'Published', dataIndex: 'publishedAt', width: 140,
      render: d => d ? dayjs(d).format('MMM D, YYYY') : '—' },
    { title: 'Views', dataIndex: 'viewCount', width: 80, align: 'right' },
    {
      title: 'Actions', width: 160, fixed: 'right',
      render: (_, r) => (
        <Space>
          <Tooltip title="Edit"><Button size="small" icon={<EditOutlined />} onClick={() => navigate(`/blog/posts/${r.id}`)} /></Tooltip>
          {r.status !== 'PUBLISHED'
            ? <Tooltip title="Publish"><Button size="small" icon={<CheckCircleOutlined />} onClick={() => publishMut.mutate(r.id)} /></Tooltip>
            : <Tooltip title="Unpublish"><Button size="small" icon={<StopOutlined />} onClick={() => unpublishMut.mutate(r.id)} /></Tooltip>
          }
          <Popconfirm title="Delete this post?" onConfirm={() => deleteMut.mutate(r.id)} okText="Delete" okButtonProps={{ danger: true }}>
            <Tooltip title="Delete"><Button size="small" danger icon={<DeleteOutlined />} /></Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>Blog Posts</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/blog/posts/new')}>New Post</Button>
      </div>

      <Space style={{ marginBottom: 16 }} wrap>
        <Search placeholder="Search posts..." onSearch={v => setFilters(f => ({ ...f, search: v }))} style={{ width: 280 }} allowClear />
        <Select placeholder="Filter by status" allowClear style={{ width: 180 }}
          onChange={v => setFilters(f => ({ ...f, status: v || '' }))}
          options={['DRAFT','PENDING_REVIEW','SCHEDULED','PUBLISHED','ARCHIVED'].map(s => ({ value: s, label: s }))}
        />
      </Space>

      <Table
        columns={columns} dataSource={data?.data} loading={isLoading}
        rowKey="id" scroll={{ x: 900 }}
        pagination={{ total: data?.meta?.total, pageSize: 20, current: page, onChange: setPage, showSizeChanger: false }}
      />
    </div>
  );
}
