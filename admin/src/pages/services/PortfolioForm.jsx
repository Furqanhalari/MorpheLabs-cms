import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Form, Input, Select, Button, Card, Row, Col, Space, Typography, message, DatePicker, Spin } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import api from '../../services/api';
import dayjs from 'dayjs';

const { Title } = Typography;

export default function PortfolioForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form] = Form.useForm();
  const [content, setContent] = useState('');
  const isEdit = Boolean(id);

  const { data: item, isLoading } = useQuery({
    queryKey: ['portfolio-item', id], enabled: isEdit,
    queryFn:  () => api.get(`/services/portfolio/${id}`).then(r => r.data),
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn:  () => api.get('/services').then(r => r.data),
  });

  useEffect(() => {
    if (item) {
      form.setFieldsValue({ ...item, completedAt: item.completedAt ? dayjs(item.completedAt) : null });
      setContent(item.content || '');
    }
  }, [item, form]);

  const saveMut = useMutation({
    mutationFn: vals => isEdit
      ? api.put(`/services/portfolio/${id}`, vals)
      : api.post('/services/portfolio', vals),
    onSuccess: res => {
      qc.invalidateQueries(['portfolio']);
      message.success('Saved');
      if (!isEdit) navigate(`/services/portfolio/${res.data.id}`);
    },
    onError: e => message.error(e.response?.data?.error || 'Save failed'),
  });

  const handleSave = async () => {
    const vals = await form.validateFields();
    saveMut.mutate({ ...vals, content, completedAt: vals.completedAt?.toISOString() });
  };

  if (isEdit && isLoading) return <Spin size="large" style={{ display: 'block', marginTop: 80 }} />;

  return (
    <div>
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/services/portfolio')} />
          <Title level={3} style={{ margin: 0 }}>{isEdit ? 'Edit Portfolio Item' : 'New Portfolio Item'}</Title>
        </Space>
        <Button type="primary" icon={<SaveOutlined />} loading={saveMut.isPending} onClick={handleSave}>Save</Button>
      </div>

      <Form form={form} layout="vertical">
        <Row gutter={24}>
          <Col xs={24} lg={17}>
            <Card className="form-card" style={{ marginBottom: 16 }}>
              <Form.Item name="title" label="Case Study Title" rules={[{ required: true }]}>
                <Input size="large" placeholder="e.g. AI Chatbot for TechCorp" />
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="clientName" label="Client Name" rules={[{ required: true }]}>
                    <Input placeholder="Client company name" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="industry" label="Industry" rules={[{ required: true }]}>
                    <Input placeholder="e.g. Real Estate, Healthcare" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="description" label="Short Description">
                <Input.TextArea rows={2} />
              </Form.Item>
              <Form.Item label="Full Case Study">
                <ReactQuill theme="snow" value={content} onChange={setContent} />
              </Form.Item>
            </Card>
          </Col>

          <Col xs={24} lg={7}>
            <Card className="sider-card" title="Details" style={{ marginBottom: 16 }}>
              <Form.Item name="serviceId" label="Related Service">
                <Select allowClear placeholder="Select service"
                  options={services.map(s => ({ value: s.id, label: s.title }))} />
              </Form.Item>
              <Form.Item name="completedAt" label="Completion Date">
                <DatePicker picker="month" style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="coverImage" label="Cover Image URL">
                <Input placeholder="https://..." />
              </Form.Item>
              <Form.Item name="tags" label="Tags">
                <Select mode="tags" placeholder="Add tags" style={{ width: '100%' }} />
              </Form.Item>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  );
}
