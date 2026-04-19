import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Layout, Menu, Avatar, Dropdown, Typography, Button, Space, Badge,
} from 'antd';
import {
  DashboardOutlined, FileTextOutlined, AppstoreOutlined,
  TeamOutlined, PictureOutlined, UserOutlined, AuditOutlined,
  LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
  BellOutlined, SettingOutlined, BriefcaseOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

const navItems = [
  { key: '/',                   icon: <DashboardOutlined />, label: 'Dashboard' },
  {
    key: 'blog', icon: <FileTextOutlined />, label: 'Blog',
    children: [
      { key: '/blog/posts',      label: 'All Posts' },
      { key: '/blog/posts/new',  label: 'New Post' },
      { key: '/blog/categories', label: 'Categories' },
    ],
  },
  {
    key: 'services', icon: <AppstoreOutlined />, label: 'Services',
    children: [
      { key: '/services',               label: 'Services' },
      { key: '/services/portfolio',     label: 'Portfolio' },
    ],
  },
  {
    key: 'careers', icon: <BriefcaseOutlined />, label: 'Careers',
    children: [
      { key: '/careers',     label: 'Job Listings' },
      { key: '/careers/new', label: 'New Listing' },
    ],
  },
  { key: '/media',  icon: <PictureOutlined />,  label: 'Media Library' },
  { key: '/users',  icon: <TeamOutlined />,     label: 'Users' },
  { key: '/audit',  icon: <AuditOutlined />,    label: 'Audit Log' },
];

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleMenuClick = ({ key }) => { if (key.startsWith('/')) navigate(key); };

  const userMenu = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: 'Profile' },
      { key: 'settings', icon: <SettingOutlined />, label: 'Settings' },
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', danger: true },
    ],
    onClick: async ({ key }) => {
      if (key === 'logout') { await logout(); navigate('/login'); }
    },
  };

  // Filter nav based on permissions
  const visibleNav = navItems.filter(item => {
    if (item.key === '/users')  return hasPermission('users', 'read');
    if (item.key === '/audit')  return hasPermission('audit', 'read');
    if (item.key === 'blog')    return hasPermission('posts', 'read');
    if (item.key === 'services')return hasPermission('services', 'read');
    if (item.key === 'careers') return hasPermission('careers', 'read');
    return true;
  });

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible collapsed={collapsed} trigger={null}
        width={240} style={{ position: 'fixed', height: '100vh', left: 0, top: 0, zIndex: 100 }}
      >
        {/* Logo */}
        <div style={{ padding: collapsed ? '16px 8px' : '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 8 }}>
          {collapsed
            ? <Text style={{ color: '#00B4D8', fontWeight: 800, fontSize: 18 }}>M</Text>
            : <Text style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>
                <span style={{ color: '#00B4D8' }}>Morphe</span>Labs CMS
              </Text>
          }
        </div>

        <Menu
          theme="dark" mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={['blog','services','careers']}
          items={visibleNav}
          onClick={handleMenuClick}
          style={{ border: 'none' }}
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 240, transition: 'margin 0.2s' }}>
        <Header style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', position:'sticky', top:0, zIndex:99, boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>
          <Button
            type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
          <Space>
            <Badge count={0}><Button type="text" icon={<BellOutlined />} /></Badge>
            <Dropdown menu={userMenu} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar style={{ background: '#00B4D8' }}>
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </Avatar>
                {!collapsed && (
                  <span style={{ fontSize: 13 }}>
                    {user?.firstName} {user?.lastName}
                    <br />
                    <Text type="secondary" style={{ fontSize: 11 }}>{user?.role?.replace(/_/g,' ')}</Text>
                  </span>
                )}
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{ padding: 24, background: '#f5f7fa' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
