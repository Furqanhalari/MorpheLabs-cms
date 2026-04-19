import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Tag, Space, Typography, Popconfirm, Switch, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import dayjs from 'dayjs';

const { Title } = Typography;

export default function PortfolioList() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['portfolio'],
    queryFn:  () => api.get('/services/portfolio/all').then(r => r.data),
  });

  const deleteMut = useMutation({
    mutationFn: id => api.delete(`/services/portfolio/${id}`),
    onSuccess: () => { qc.invalidateQueries(['portfolio']); message.success('Deleted'); },
  });

  const toggleMut = useMutation({
    mutationFn: id => api.put(`/services/portfolio/${id}`, { isPublished: !items.find(i => i.id === id)?.isPublished }),
    onSuccess: () => qc.invalidateQueries(['portfolio']),
  });

  const columns = [
    { title: 'Title',    dataIndex: 'title', render: (t,r) => <a onClick={() => navigate(`/services/portfolio/${r.id}`)}>{t}</a> },
    { title: 'Client',   dataIndex: 'clientName' },
    { title: 'Industry', dataIndex: 'industry' },
    { title: 'Service',  render: (_,r) => r.service?.title || '—' },
    { title: 'Completed', dataIndex: 'completedAt', render: d => d ? dayjs(d).format('MMM YYYY') : '—' },
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
          <Button size="small" icon={<EditOutlined />} onClick={() => navigate(`/services/portfolio/${r.id}`)} />
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
        <Title level={3} style={{ margin: 0 }}>Portfolio Items</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/services/portfolio/new')}>New Item</Button>
      </div>
      <Table columns={columns} dataSource={items} loading={isLoading} rowKey="id" />
    </div>
  );
}
