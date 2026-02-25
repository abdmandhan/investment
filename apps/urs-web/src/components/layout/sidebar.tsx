'use client';

import {
  Box,
  Flex,
  VStack,
  Text,
  Icon,
  Link,
  Separator,
} from '@chakra-ui/react';
import {
  FiHome,
  FiUsers,
  FiFileText,
  FiSettings,
  FiShield,
} from 'react-icons/fi';

interface SidebarItemProps {
  icon: any;
  label: string;
}

function SidebarItem({ icon, label }: SidebarItemProps) {
  return (
    <Link
      _hover={{ textDecoration: 'none', opacity: 0.8, }}
      borderRadius="md"
      p={3}
      w="full"
    >
      <Flex align="center" gap={3}>
        <Icon as={icon} boxSize={5} />
        <Text fontSize="sm" fontWeight="medium">
          {label}
        </Text>
      </Flex>
    </Link>
  );
}

export default function Sidebar() {
  return (
    <Box
      w="260px"
      borderRight="1px solid"
      borderColor="gray.200"
      minH="100vh"
      p={4}
    >
      <Text fontSize="lg" fontWeight="bold" mb={6}>
        URS Dashboard
      </Text>

      <VStack align="stretch" gap={2}>
        <SidebarItem icon={FiHome} label="Dashboard" />
        <SidebarItem icon={FiUsers} label="Users" />
        <SidebarItem icon={FiFileText} label="Units Registry" />
        <SidebarItem icon={FiShield} label="Roles & Permissions" />

        <Separator my={4} />

        <SidebarItem icon={FiSettings} label="Settings" />
      </VStack>
    </Box>
  );
}
