// Categories.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Form, Input, Modal, Space, Typography, Popconfirm, message, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../../services/api';

const { Title } = Typography;

export default function Categories() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [form]  = Form.useForm();
  const qc = useQueryClient();

  const { data: cats = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn:  () => api.get('/blog/categories/all').then(r => r.data),
  });

  const saveMut = useMutation({
    mutationFn: vals => editing
      ? api.put(`/blog/categories/${editing.id}`, vals)
      : api.post('/blog/categories', vals),
    onSuccess: () => {
      qc.invalidateQueries(['categories']);
      message.success(editing ? 'Updated' : 'Created');
      setModalOpen(false); setEditing(null); form.resetFields();
    },
  });

  const deleteMut = useMutation({
    mutationFn: id => api.delete(`/blog/categories/${id}`),
    onSuccess: () => { qc.invalidateQueries(['categories']); message.success('Deleted'); },
  });

  const openEdit = (cat) => { setEditing(cat); form.setFieldsValue(cat); setModalOpen(true); };
  const openNew  = () => { setEditing(null); form.resetFields(); setModalOpen(true); };

  const columns = [
    { title: 'Name',  dataIndex: 'name' },
    { title: 'Slug',  dataIndex: 'slug', render: s => <Tag>{s}</Tag> },
    { title: 'Posts', render: (_, r) => r._count?.posts ?? 0, align: 'right', width: 80 },
    {
      title: 'Actions', width: 100,
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          <Popconfirm title="Delete category?" onConfirm={() => deleteMut.mutate(r.id)} okButtonProps={{ danger: true }}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>Blog Categories</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openNew}>New Category</Button>
      </div>
      <Table columns={columns} dataSource={cats} loading={isLoading} rowKey="id" pagination={false} />
      <Modal title={editing ? 'Edit Category' : 'New Category'} open={modalOpen}
        onOk={() => form.submit()} onCancel={() => setModalOpen(false)}
        confirmLoading={saveMut.isPending}>
        <Form form={form} layout="vertical" onFinish={saveMut.mutate}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="Description"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="color" label="Color (hex)"><Input placeholder="#00B4D8" /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
