import bcrypt from 'bcryptjs';
import prisma from '../index.js';

export default async () => {
  const menus: { [key: string]: { actions: string[] } } = {
    // operator menu
    'dashboard.operator': { actions: ['view'] },

    // admin menu
    'dashboard.admin': { actions: ['view'] },

    // agent menu
    'dashboard.agent': { actions: ['view'] },

    // investor menu
    'dashboard.investor': { actions: ['view'] },

    // global menu
    'manage.investors': {
      actions: ['view', 'edit', 'delete', 'create', 'approval'],
    },
    'manage.funds': {
      actions: ['view', 'edit', 'delete', 'create', 'approval'],
    },
    'manage.fund_types': {
      actions: ['view', 'edit', 'delete', 'create', 'approval'],
    },
    'manage.nav': { actions: ['view', 'edit', 'delete', 'create', 'approval'] },
    'manage.transactions': {
      actions: ['view', 'edit', 'delete', 'create', 'approval'],
    },
    'manage.agents': {
      actions: ['view', 'edit', 'delete', 'create', 'approval'],
    },
    'manage.agents.levels': {
      actions: ['view', 'edit', 'delete', 'create', 'approval'],
    },
    'reports.dashboard': { actions: ['view'] },
    'reports.investors': { actions: ['view'] },
    'reports.transactions': { actions: ['view'] },
    'reports.agents': { actions: ['view'] },
    'reports.funds': { actions: ['view'] },
    'manage.settings': { actions: ['view', 'edit', 'delete', 'create'] },
    'manage.users': { actions: ['view', 'edit', 'delete', 'create'] },
    'manage.roles': { actions: ['view', 'edit', 'delete', 'create'] },
  };

  // const permissions = Object.values(menus).flatMap(menu => menu.actions.map(action => `${menu}.${action}`))
  const permissions = Object.keys(menus).flatMap((menu) => menus[menu].actions.map((action) => `${menu}.${action}`));

  const roles: { name: string; permissions: string[]; color?: string; description?: string }[] = [
    {
      name: 'Maker',
      color: '#1976d2',
      description: 'Maker role',
      permissions: [
        ...permissions.filter((permission) => permission.includes('dashboard.operator')),
        // exlude approval permission
        ...permissions.filter(
          (permission) => permission.includes('manage.investors') && !permission.includes('approval'),
        ),
        ...permissions.filter((permission) => permission.includes('manage.funds') && !permission.includes('approval')),
        ...permissions.filter(
          (permission) => permission.includes('manage.fund_types') && !permission.includes('approval'),
        ),
        ...permissions.filter((permission) => permission.includes('manage.nav') && !permission.includes('approval')),
        ...permissions.filter(
          (permission) => permission.includes('manage.transactions') && !permission.includes('approval'),
        ),
        ...permissions.filter((permission) => permission.includes('manage.agents') && !permission.includes('approval')),
        ...permissions.filter(
          (permission) => permission.includes('manage.agents.levels') && !permission.includes('approval'),
        ),
      ],
    },
    {
      name: 'Approver',
      color: '#2e7d32',
      description: 'Approver role',
      permissions: [
        // only view and approval
        ...permissions.filter((permission) => permission.includes('dashboard.operator') && permission.includes('view')),
        ...permissions.filter(
          (permission) =>
            permission.includes('manage.investors') && (permission.includes('approval') || permission.includes('view')),
        ),
        ...permissions.filter(
          (permission) =>
            permission.includes('manage.funds') && (permission.includes('approval') || permission.includes('view')),
        ),
        ...permissions.filter(
          (permission) =>
            permission.includes('manage.fund_types') &&
            (permission.includes('approval') || permission.includes('view')),
        ),
        ...permissions.filter(
          (permission) =>
            permission.includes('manage.nav') && (permission.includes('approval') || permission.includes('view')),
        ),
        ...permissions.filter(
          (permission) =>
            permission.includes('manage.transactions') &&
            (permission.includes('approval') || permission.includes('view')),
        ),
        ...permissions.filter(
          (permission) =>
            permission.includes('manage.agents') && (permission.includes('approval') || permission.includes('view')),
        ),
        ...permissions.filter(
          (permission) =>
            permission.includes('manage.agents.levels') &&
            (permission.includes('approval') || permission.includes('view')),
        ),
      ],
    },
    {
      name: 'Admin',
      color: '#d32f2f',
      description: 'Admin role',
      permissions: [
        ...permissions.filter((permission) => permission.includes('dashboard.admin')),
        ...permissions.filter((permission) => permission.includes('manage.investors')),
        ...permissions.filter((permission) => permission.includes('manage.funds')),
        ...permissions.filter((permission) => permission.includes('manage.fund_types')),
        ...permissions.filter((permission) => permission.includes('manage.nav')),
        ...permissions.filter((permission) => permission.includes('manage.transactions')),
        ...permissions.filter((permission) => permission.includes('manage.agents')),
        ...permissions.filter((permission) => permission.includes('manage.agents.levels')),
        ...permissions.filter((permission) => permission.includes('manage.settings')),
        ...permissions.filter((permission) => permission.includes('manage.users')),
        ...permissions.filter((permission) => permission.includes('manage.roles')),
      ],
    },
  ];

  await Promise.all(
    permissions.map(async (permission) => {
      await prisma.permissions.upsert({
        where: { name: permission },
        create: { name: permission },
        update: { name: permission },
      });
    }),
  );

  await Promise.all(
    roles.map(async (role) => {
      const _role = await prisma.roles.upsert({
        where: { name: role.name },
        create: { name: role.name, color: role.color, description: role.description },
        update: { name: role.name, color: role.color, description: role.description },
      });

      const uniquePermissions = Array.from(new Set(role.permissions));
      for (const p of uniquePermissions) {
        const _permission = await prisma.permissions.findFirst({
          where: { name: p },
        });
        if (_permission) {
          await prisma.role_permissions.upsert({
            where: {
              permission_id_role_id: {
                permission_id: _permission.id,
                role_id: _role.id,
              },
            },
            create: { permission_id: _permission.id, role_id: _role.id },
            update: { permission_id: _permission.id, role_id: _role.id },
          });
        } else {
          console.warn('permission not found', p);
        }
      }
    }),
  );

  const users = [
    {
      name: 'Admin',
      username: 'admin',
      password: '12341234',
      email: 'admin@example.com',
      phone_number: '081234567890',
      avatar: 'https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/512/1.jpg',
      roles: ['Admin'],
    },
    {
      name: 'Maker 1',
      username: 'maker1',
      password: '12341234',
      email: 'maker1@example.com',
      phone_number: '081234567890',
      avatar: 'https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/512/2.jpg',
      roles: ['Maker'],
    },
    {
      name: 'Approver 1',
      username: 'approver1',
      password: '12341234',
      email: 'approver1@example.com',
      phone_number: '081234567890',
      avatar: 'https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/512/3.jpg',
      roles: ['Approver'],
    },
  ];

  await Promise.all(
    users.map(async (user) => {
      const _user = await prisma.users.upsert({
        where: { username: user.username },
        create: {
          name: user.name,
          username: user.username,
          email: user.email,
          phone_number: user.phone_number,
          avatar: user.avatar,
          password: bcrypt.hashSync(user.password, 10),
        },
        update: {
          name: user.name,
          username: user.username,
          email: user.email,
          phone_number: user.phone_number,
          avatar: user.avatar,
          password: bcrypt.hashSync(user.password, 10),
        },
      });

      for (const role of user.roles) {
        const _role = await prisma.roles.findFirst({ where: { name: role } });
        if (_role) {
          await prisma.user_roles.upsert({
            where: {
              user_id_role_id: { user_id: _user.id, role_id: _role.id },
            },
            create: {
              user_id: _user.id,
              role_id: _role.id,
            },
            update: {
              user_id: _user.id,
              role_id: _role.id,
            },
          });
        }
      }
    }),
  );
};
