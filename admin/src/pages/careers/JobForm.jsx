import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Form, Input, Select, Button, Card, Row, Col, Space, Typography, message, DatePicker, InputNumber, Spin } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, SendOutlined } from '@ant-design/icons';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import api from '../../services/api';
import dayjs from 'dayjs';

const { Title } = Typography;
const QUILL_MODULES = { toolbar: [['bold','italic','underline'],['blockquote'],['link'],['clean'],
  [{ list: 'ordered' }, { list: 'bullet' }]] };

export default function JobForm() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const qc       = useQueryClient();
  const [form]   = Form.useForm();
  const isEdit   = Boolean(id);
  const [desc, setDesc]  = useState('');
  const [req,  setReq]   = useState('');
  const [resp, setResp]  = useState('');
  const [ben,  setBen]   = useState('');

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', id], enabled: isEdit,
    queryFn:  () => api.get(`/careers/${id}`).then(r => r.data),
  });

  useEffect(() => {
    if (job) {
      form.setFieldsValue({ ...job, applicationDeadline: job.applicationDeadline ? dayjs(job.applicationDeadline) : null });
      setDesc(job.description || ''); setReq(job.requirements || '');
      setResp(job.responsibilities || ''); setBen(job.benefits || '');
    }
  }, [job, form]);

  const saveMut = useMutation({
    mutationFn: vals => isEdit ? api.put(`/careers/${id}`, vals) : api.post('/careers', vals),
    onSuccess: res => { qc.invalidateQueries(['jobs']); message.success('Saved'); if (!isEdit) navigate(`/careers/${res.data.id}`); },
    onError: e => message.error(e.response?.data?.error || 'Save failed'),
  });

  const publishMut = useMutation({
    mutationFn: () => api.patch(`/careers/${id}/publish`),
    onSuccess: () => { qc.invalidateQueries(['jobs','job']); message.success('Published!'); },
  });

  const handleSave = async () => {
    const vals = await form.validateFields();
    const payload = { ...vals, description: desc, requirements: req, responsibilities: resp, benefits: ben,
      applicationDeadline: vals.applicationDeadline?.toISOString() };
    saveMut.mutate(payload);
  };

  if (isEdit && isLoading) return <Spin size="large" style={{ display:'block', marginTop: 80 }} />;

  return (
    <div>
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/careers')} />
          <Title level={3} style={{ margin: 0 }}>{isEdit ? 'Edit Job Listing' : 'New Job Listing'}</Title>
        </Space>
        <Space>
          <Button icon={<SaveOutlined />} loading={saveMut.isPending} onClick={handleSave}>Save</Button>
          {isEdit && job?.status !== 'ACTIVE' && (
            <Button type="primary" icon={<SendOutlined />} onClick={() => publishMut.mutate()}
              style={{ background: '#52c41a', borderColor: '#52c41a' }}>Publish</Button>
          )}
        </Space>
      </div>

      <Form form={form} layout="vertical">
        <Row gutter={24}>
          <Col xs={24} lg={17}>
            <Card className="form-card" style={{ marginBottom: 16 }}>
              <Form.Item name="title" label="Job Title" rules={[{ required: true }]}>
                <Input size="large" placeholder="e.g. Senior AI Engineer" />
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="department" label="Department" rules={[{ required: true }]}>
                    <Input placeholder="e.g. Engineering" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="location" label="Location" rules={[{ required: true }]}>
                    <Input placeholder="e.g. Remote / Karachi, PK" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="locationType" label="Location Type" initialValue="HYBRID">
                    <Select options={['REMOTE','ONSITE','HYBRID'].map(v => ({ value: v, label: v }))} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="employmentType" label="Employment Type" initialValue="FULL_TIME">
                    <Select options={['FULL_TIME','PART_TIME','CONTRACT','INTERNSHIP','FREELANCE'].map(v => ({ value: v, label: v.replace(/_/g,' ') }))} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {[['Job Description','desc',desc,setDesc],['Requirements','req',req,setReq],
              ['Responsibilities','resp',resp,setResp],['Benefits','ben',ben,setBen]].map(([label,,val,setter]) => (
              <Card key={label} className="form-card" title={label} style={{ marginBottom: 16 }}>
                <ReactQuill theme="snow" value={val} onChange={setter} modules={QUILL_MODULES} />
              </Card>
            ))}
          </Col>

          <Col xs={24} lg={7}>
            <Card className="sider-card" title="Salary" style={{ marginBottom: 16 }}>
              <Form.Item name="salaryCurrency" label="Currency" initialValue="USD">
                <Select options={[{value:'USD',label:'USD'},{value:'PKR',label:'PKR'},{value:'EUR',label:'EUR'}]} />
              </Form.Item>
              <Row gutter={8}>
                <Col span={12}><Form.Item name="salaryMin" label="Min"><InputNumber style={{ width:'100%' }} placeholder="50000" /></Form.Item></Col>
                <Col span={12}><Form.Item name="salaryMax" label="Max"><InputNumber style={{ width:'100%' }} placeholder="80000" /></Form.Item></Col>
              </Row>
            </Card>

            <Card className="sider-card" title="Deadline">
              <Form.Item name="applicationDeadline" label="Application Deadline">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  );
}
