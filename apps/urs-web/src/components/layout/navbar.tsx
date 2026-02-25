'use client';

import { Flex, Text, Avatar } from '@chakra-ui/react';
import { ColorModeButton } from '../ui/color-mode';

export default function Navbar() {
  return (
    <Flex
      h="60px"
      px={6}
      align="center"
      justify="space-between"
      borderBottom="1px"
      borderColor="gray.200"
    // bg="white"
    >
      <Text fontSize="md" fontWeight="semibold">
        Welcome back
      </Text>

      <Flex align="center" gap={3}>
        <ColorModeButton />
        <Text fontSize="sm">Admin</Text>
        <Avatar.Root>
          <Avatar.Fallback name="Segun Adebayo" />
          <Avatar.Image src="https://bit.ly/sage-adebayo" />
        </Avatar.Root>
      </Flex>
    </Flex>
  );
}
