import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Form, Input, Select, Switch, Button, Card, Row, Col, Space,
  Typography, message, Tooltip, Tag, Divider, Spin,
} from 'antd';
import { SaveOutlined, EyeOutlined, SendOutlined, ArrowLeftOutlined, SyncOutlined } from '@ant-design/icons';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import api from '../../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold','italic','underline','strike','blockquote'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link','image','code-block'],
    ['clean'],
  ],
};

const QUILL_FORMATS = ['header','bold','italic','underline','strike','blockquote','list','bullet','link','image','code-block'];

export default function PostForm() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const qc         = useQueryClient();
  const [form]     = Form.useForm();
  const [content,  setContent]  = useState('');
  const [saving,   setSaving]   = useState(false);
  const [lastSaved,setLastSaved]= useState(null);
  const autosaveRef = useRef(null);
  const isEdit = Boolean(id);

  // Load post for editing
  const { data: post, isLoading } = useQuery({
    queryKey: ['post', id],
    queryFn:  () => api.get(`/blog/${id}`).then(r => r.data),
    enabled:  isEdit,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn:  () => api.get('/blog/categories/all').then(r => r.data),
  });
  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn:  () => api.get('/blog/tags/all').then(r => r.data),
  });

  useEffect(() => {
    if (post) {
      form.setFieldsValue({
        title:           post.title,
        excerpt:         post.excerpt,
        featuredImage:   post.featuredImage,
        isFeatured:      post.isFeatured,
        categories:      post.categories?.map(c => c.category.id),
        tags:            post.tags?.map(t => t.tag.id),
        metaTitle:       post.metaTitle,
        metaDescription: post.metaDescription,
      });
      setContent(post.content || '');
    }
  }, [post, form]);

  // Autosave every 60s
  useEffect(() => {
    autosaveRef.current = setInterval(() => {
      if (isEdit && content) handleSave(false);
    }, 60_000);
    return () => clearInterval(autosaveRef.current);
  }, [content, isEdit]);

  const saveMut = useMutation({
    mutationFn: (values) => isEdit
      ? api.put(`/blog/${id}`, values)
      : api.post('/blog', values),
    onSuccess: (res) => {
      qc.invalidateQueries(['posts']);
      setLastSaved(new Date());
      if (!isEdit) navigate(`/blog/posts/${res.data.id}`);
    },
    onError: (e) => message.error(e.response?.data?.error || 'Save failed'),
  });

  const publishMut = useMutation({
    mutationFn: (pid) => api.patch(`/blog/${pid}/publish`),
    onSuccess: () => { qc.invalidateQueries(['posts','post']); message.success('Post published!'); },
  });

  const handleSave = async (showMsg = true) => {
    setSaving(true);
    try {
      const values = await form.validateFields(['title']);
      const all    = form.getFieldsValue(true);
      await saveMut.mutateAsync({ ...all, content });
      if (showMsg) message.success('Saved');
    } catch (_) {}
    setSaving(false);
  };

  if (isEdit && isLoading) return <Spin size="large" style={{ display:'block', marginTop:80 }} />;

  return (
    <div>
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/blog/posts')} />
          <Title level={3} style={{ margin: 0 }}>{isEdit ? 'Edit Post' : 'New Post'}</Title>
          {lastSaved && <Text type="secondary" style={{ fontSize: 12 }}><SyncOutlined /> Saved {dayjs(lastSaved).fromNow()}</Text>}
        </Space>
        <Space>
          <Button icon={<SaveOutlined />} loading={saving} onClick={() => handleSave()}>Save Draft</Button>
          {isEdit && post?.status !== 'PUBLISHED' && (
            <Button type="primary" icon={<SendOutlined />} onClick={() => publishMut.mutate(id)}
              style={{ background: '#52c41a', borderColor: '#52c41a' }}>Publish</Button>
          )}
        </Space>
      </div>

      <Form form={form} layout="vertical">
        <Row gutter={24}>
          {/* Main content */}
          <Col xs={24} lg={17}>
            <Card className="form-card" style={{ marginBottom: 16 }}>
              <Form.Item name="title" label="Post Title" rules={[{ required: true, message: 'Title is required' }]}>
                <Input size="large" placeholder="Enter post title..." style={{ fontSize: 18, fontWeight: 600 }} />
              </Form.Item>
              <Form.Item name="excerpt" label="Excerpt">
                <Input.TextArea rows={2} placeholder="Short description shown in post listings..." />
              </Form.Item>
              <Form.Item label="Content" required>
                <ReactQuill
                  theme="snow" value={content} onChange={setContent}
                  modules={QUILL_MODULES} formats={QUILL_FORMATS}
                  placeholder="Write your content here..."
                />
              </Form.Item>
            </Card>

            {/* SEO */}
            <Card className="form-card" title="SEO & Meta">
              <Form.Item name="metaTitle" label="Meta Title"><Input placeholder="SEO title (defaults to post title)" /></Form.Item>
              <Form.Item name="metaDescription" label="Meta Description">
                <Input.TextArea rows={2} placeholder="SEO description (max 160 chars)" maxLength={160} showCount />
              </Form.Item>
            </Card>
          </Col>

          {/* Sidebar */}
          <Col xs={24} lg={7}>
            <Card className="sider-card" title="Publish Settings" style={{ marginBottom: 16 }}>
              <Form.Item name="isFeatured" label="Featured Post" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item name="featuredImage" label="Featured Image URL">
                <Input placeholder="https://..." />
              </Form.Item>
            </Card>

            <Card className="sider-card" title="Categories" style={{ marginBottom: 16 }}>
              <Form.Item name="categories">
                <Select mode="multiple" placeholder="Select categories" style={{ width: '100%' }}
                  options={categories.map(c => ({ value: c.id, label: c.name }))} />
              </Form.Item>
            </Card>

            <Card className="sider-card" title="Tags">
              <Form.Item name="tags">
                <Select mode="multiple" placeholder="Select or create tags" style={{ width: '100%' }}
                  options={tags.map(t => ({ value: t.id, label: t.name }))} />
              </Form.Item>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  );
}
