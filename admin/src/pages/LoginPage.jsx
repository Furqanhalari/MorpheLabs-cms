import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Alert, Space } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text, Link } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const { login } = useAuth();
  const navigate  = useNavigate();

  const onFinish = async ({ email, password }) => {
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (e) {
      setError(e.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0D1117 0%, #111827 100%)',
    }}>
      <Card style={{ width: 400, borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ margin: 0 }}>
            <span style={{ color: '#00B4D8' }}>Morphe</span>Labs
          </Title>
          <Text type="secondary">Content Management System</Text>
        </div>

        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}

        <Form layout="vertical" onFinish={onFinish} autoComplete="off">
          <Form.Item name="email" label="Email"
            rules={[{ required: true, type: 'email', message: 'Valid email required' }]}>
            <Input prefix={<UserOutlined />} size="large" placeholder="admin@morphelabs.org" />
          </Form.Item>

          <Form.Item name="password" label="Password"
            rules={[{ required: true, message: 'Password required' }]}>
            <Input.Password prefix={<LockOutlined />} size="large" placeholder="Your password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" loading={loading} block
              style={{ background: '#00B4D8', borderColor: '#00B4D8', height: 44, fontWeight: 600 }}>
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center' }}>
          <Link href="/forgot-password" style={{ color: '#00B4D8' }}>Forgot password?</Link>
        </div>
      </Card>
    </div>
  );
}
