import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Upload, Button, Card, Image, Typography, Select, Space,
  Popconfirm, message, Spin, Empty, Row, Col, Tag, Input,
} from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Search } = Input;

const TYPE_COLORS = { IMAGE: 'blue', DOCUMENT: 'orange', VIDEO: 'purple', OTHER: 'default' };
const formatBytes = (b) => b < 1024 ? b + ' B' : b < 1048576 ? (b/1024).toFixed(1)+' KB' : (b/1048576).toFixed(1)+' MB';

export default function MediaLibrary() {
  const [typeFilter, setTypeFilter] = useState('');
  const [search,     setSearch]     = useState('');
  const [page,       setPage]       = useState(1);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['media', typeFilter, search, page],
    queryFn:  () => api.get('/media', { params: { type: typeFilter, search, page, limit: 48 } }).then(r => r.data),
  });

  const deleteMut = useMutation({
    mutationFn: id => api.delete(`/media/${id}`),
    onSuccess: () => { qc.invalidateQueries(['media']); message.success('File deleted'); },
  });

  const uploadProps = {
    name: 'file',
    action: '/api/v1/media',
    headers: { Authorization: `Bearer ${sessionStorage.getItem('accessToken')}` },
    withCredentials: true,
    showUploadList: true,
    onChange: ({ file }) => {
      if (file.status === 'done') { qc.invalidateQueries(['media']); message.success(`${file.name} uploaded`); }
      else if (file.status === 'error') message.error(`${file.name} upload failed`);
    },
  };

  return (
    <div>
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>Media Library</Title>
        <Upload {...uploadProps} multiple>
          <Button type="primary" icon={<UploadOutlined />}>Upload Files</Button>
        </Upload>
      </div>

      <Space style={{ marginBottom: 16 }} wrap>
        <Search placeholder="Search files..." onSearch={setSearch} style={{ width: 260 }} allowClear />
        <Select placeholder="Filter by type" allowClear style={{ width: 160 }}
          onChange={v => setTypeFilter(v || '')}
          options={['IMAGE','DOCUMENT','VIDEO','OTHER'].map(t => ({ value: t, label: t }))} />
        <Text type="secondary">{data?.meta?.total ?? 0} files</Text>
      </Space>

      {isLoading ? (
        <Spin size="large" style={{ display: 'block', marginTop: 60 }} />
      ) : data?.data?.length === 0 ? (
        <Empty description="No files found" />
      ) : (
        <Row gutter={[12, 12]}>
          {data?.data?.map(file => (
            <Col key={file.id} xs={12} sm={8} md={6} lg={4} xl={3}>
              <Card
                size="small"
                cover={
                  file.type === 'IMAGE'
                    ? <Image src={file.url} alt={file.alt || file.originalName} height={100} style={{ objectFit:'cover' }} />
                    : <div style={{ height:100, display:'flex', alignItems:'center', justifyContent:'center', background:'#f5f5f5', fontSize:32 }}>
                        {file.type === 'DOCUMENT' ? '📄' : file.type === 'VIDEO' ? '🎬' : '📁'}
                      </div>
                }
                actions={[
                  <Popconfirm key="del" title="Delete this file?" onConfirm={() => deleteMut.mutate(file.id)} okButtonProps={{ danger: true }}>
                    <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>,
                ]}
              >
                <div style={{ fontSize: 11 }}>
                  <Text ellipsis style={{ display:'block', fontSize:11 }}>{file.originalName}</Text>
                  <Tag color={TYPE_COLORS[file.type]} style={{ fontSize:9 }}>{file.type}</Tag>
                  <Text type="secondary" style={{ fontSize:10 }}>{formatBytes(file.size)}</Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
