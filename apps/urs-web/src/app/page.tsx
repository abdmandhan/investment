'use client';
import Navbar from "@/components/layout/navbar";
import Sidebar from "@/components/layout/sidebar";
import { Box, Flex, Tabs } from "@chakra-ui/react";
import { LuFolder, LuSquareCheck, LuUser } from "react-icons/lu";

export default function Index() {
  return (
    <Flex minH="100vh">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Area */}
      <Flex direction="column" flex="1">
        <Navbar />

        <Box p={6} flex="1">
          <Tabs.Root defaultValue="members" >
            <Tabs.List gap={"4"}>
              <Tabs.Trigger value="members">
                <LuUser />
                Members
              </Tabs.Trigger>
              <Tabs.Trigger value="projects">
                <LuFolder />
                Projects
              </Tabs.Trigger>
              <Tabs.Trigger value="tasks">
                <LuSquareCheck />
                Settings
              </Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="members">Manage your team members</Tabs.Content>
            <Tabs.Content value="projects">Manage your projects</Tabs.Content>
            <Tabs.Content value="tasks">
              Manage your tasks for freelancers
            </Tabs.Content>
          </Tabs.Root>
        </Box>
      </Flex>
    </Flex>
  );
}
