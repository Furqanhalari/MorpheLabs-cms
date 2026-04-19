import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Form, Input, Select, Button, Card, Row, Col,
  Space, Typography, message, Spin,
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import api from '../../services/api';

const { Title } = Typography;

export default function ServiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form] = Form.useForm();
  const [content, setContent] = useState('');
  const isEdit = Boolean(id);

  const { data: service, isLoading } = useQuery({
    queryKey: ['service', id], enabled: isEdit,
    queryFn:  () => api.get(`/services/${id}`).then(r => r.data),
  });

  const { data: cats = [] } = useQuery({
    queryKey: ['service-categories'],
    queryFn:  () => api.get('/services/categories/all').then(r => r.data),
  });

  useEffect(() => {
    if (service) {
      form.setFieldsValue({ ...service, categoryId: service.categoryId });
      setContent(service.content || '');
    }
  }, [service, form]);

  const saveMut = useMutation({
    mutationFn: vals => isEdit ? api.put(`/services/${id}`, vals) : api.post('/services', vals),
    onSuccess: res => {
      qc.invalidateQueries(['services']);
      message.success('Saved successfully');
      if (!isEdit) navigate(`/services/${res.data.id}`);
    },
    onError: e => message.error(e.response?.data?.error || 'Save failed'),
  });

  const handleSave = async () => {
    const vals = await form.validateFields();
    saveMut.mutate({ ...vals, content });
  };

  if (isEdit && isLoading) return <Spin size="large" style={{ display: 'block', marginTop: 80 }} />;

  return (
    <div>
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/services')} />
          <Title level={3} style={{ margin: 0 }}>{isEdit ? 'Edit Service' : 'New Service'}</Title>
        </Space>
        <Button type="primary" icon={<SaveOutlined />} loading={saveMut.isPending} onClick={handleSave}>Save</Button>
      </div>

      <Form form={form} layout="vertical">
        <Row gutter={24}>
          <Col xs={24} lg={17}>
            <Card className="form-card" style={{ marginBottom: 16 }}>
              <Form.Item name="title" label="Service Title" rules={[{ required: true }]}>
                <Input size="large" placeholder="e.g. AI Chatbots" />
              </Form.Item>
              <Form.Item name="description" label="Short Description" rules={[{ required: true }]}>
                <Input.TextArea rows={2} placeholder="Brief overview shown in listings..." />
              </Form.Item>
              <Form.Item label="Full Content (Rich Text)">
                <ReactQuill theme="snow" value={content} onChange={setContent}
                  modules={{ toolbar: [['bold','italic','underline'],['blockquote'],['link'],
                    [{ list:'ordered' },{ list:'bullet' }],['clean']] }} />
              </Form.Item>
            </Card>

            <Card className="form-card" title="SEO">
              <Form.Item name="metaTitle" label="Meta Title"><Input /></Form.Item>
              <Form.Item name="metaDesc" label="Meta Description">
                <Input.TextArea rows={2} maxLength={160} showCount />
              </Form.Item>
            </Card>
          </Col>

          <Col xs={24} lg={7}>
            <Card className="sider-card" title="Details" style={{ marginBottom: 16 }}>
              <Form.Item name="categoryId" label="Category">
                <Select allowClear placeholder="Select category"
                  options={cats.map(c => ({ value: c.id, label: c.name }))} />
              </Form.Item>
              <Form.Item name="icon" label="Icon (emoji or URL)">
                <Input placeholder="🤖 or https://..." />
              </Form.Item>
              <Form.Item name="image" label="Cover Image URL">
                <Input placeholder="https://..." />
              </Form.Item>
              <Form.Item name="sortOrder" label="Sort Order" initialValue={0}>
                <Input type="number" />
              </Form.Item>
            </Card>

            <Card className="sider-card" title="Features">
              <Form.Item name="features" label="Feature Bullet Points">
                <Select mode="tags" placeholder="Type a feature and press Enter"
                  style={{ width: '100%' }} tokenSeparators={[',']} />
              </Form.Item>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  );
}
