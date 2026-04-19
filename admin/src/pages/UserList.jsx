import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table, Button, Tag, Space, Typography, Modal, Form,
  Input, Select, Switch, Popconfirm, Avatar, message,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const ROLE_COLORS = {
  SUPER_ADMIN:'red', CONTENT_MANAGER:'purple', BLOG_EDITOR:'blue',
  BLOG_AUTHOR:'cyan', HR_MANAGER:'green', VIEWER:'default',
};

const ROLES = ['SUPER_ADMIN','CONTENT_MANAGER','BLOG_EDITOR','BLOG_AUTHOR','HR_MANAGER','VIEWER'];

export default function UserList() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const { user: me } = useAuth();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn:  () => api.get('/users').then(r => r.data),
  });

  const createMut = useMutation({
    mutationFn: vals => api.post('/users', vals),
    onSuccess: () => { qc.invalidateQueries(['users']); message.success('User invited — check email'); setModalOpen(false); form.resetFields(); },
    onError: e => message.error(e.response?.data?.error || 'Failed'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...vals }) => api.patch(`/users/${id}`, vals),
    onSuccess: () => { qc.invalidateQueries(['users']); message.success('Updated'); setModalOpen(false); setEditing(null); },
  });

  const deleteMut = useMutation({
    mutationFn: id => api.delete(`/users/${id}`),
    onSuccess: () => { qc.invalidateQueries(['users']); message.success('Deleted'); },
  });

  const openEdit = (u) => { setEditing(u); form.setFieldsValue({ role: u.role, isActive: u.isActive }); setModalOpen(true); };
  const openNew  = () => { setEditing(null); form.resetFields(); setModalOpen(true); };

  const handleOk = () => {
    form.validateFields().then(vals => {
      editing ? updateMut.mutate({ id: editing.id, ...vals }) : createMut.mutate(vals);
    });
  };

  const columns = [
    {
      title: 'User', width: 240,
      render: (_, r) => (
        <Space>
          <Avatar style={{ background: '#00B4D8' }}>{r.firstName[0]}{r.lastName[0]}</Avatar>
          <div>
            <div style={{ fontWeight: 600 }}>{r.firstName} {r.lastName} {r.id === me?.id && <Tag color="gold">You</Tag>}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>{r.email}</Text>
          </div>
        </Space>
      ),
    },
    { title: 'Role', dataIndex: 'role', render: r => <Tag color={ROLE_COLORS[r]}>{r?.replace(/_/g,' ')}</Tag> },
    { title: 'Status', dataIndex: 'isActive', render: a => <Tag color={a ? 'green' : 'red'}>{a ? 'Active' : 'Inactive'}</Tag> },
    { title: 'Last Login', dataIndex: 'lastLoginAt', render: d => d ? dayjs(d).fromNow() : 'Never' },
    { title: 'Joined', dataIndex: 'createdAt', render: d => dayjs(d).format('MMM D, YYYY') },
    {
      title: 'Actions', width: 100,
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          {r.id !== me?.id && (
            <Popconfirm title="Delete user?" onConfirm={() => deleteMut.mutate(r.id)} okButtonProps={{ danger: true }}>
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>Users</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openNew}>Invite User</Button>
      </div>

      <Table columns={columns} dataSource={users} loading={isLoading} rowKey="id" />

      <Modal title={editing ? 'Edit User' : 'Invite New User'} open={modalOpen}
        onOk={handleOk} onCancel={() => { setModalOpen(false); setEditing(null); }}
        confirmLoading={createMut.isPending || updateMut.isPending}>
        <Form form={form} layout="vertical">
          {!editing && (
            <>
              <Space style={{ width:'100%' }} direction="vertical">
                <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}><Input /></Form.Item>
                <Form.Item name="lastName"  label="Last Name"  rules={[{ required: true }]}><Input /></Form.Item>
                <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
              </Space>
            </>
          )}
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Select options={ROLES.map(r => ({ value: r, label: r.replace(/_/g,' ') }))} />
          </Form.Item>
          {editing && (
            <Form.Item name="isActive" label="Active" valuePropName="checked">
              <Switch />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
}
