import React, { useRef } from 'react';
import { OrchestratorAgent } from './agents/OrchestratorAgent';
import useWorkflowStore from './store/workflowStore';
import TopBar from './components/TopBar/TopBar';
import LeftPanel from './components/LeftPanel/LeftPanel';
import RedemptionForm from './components/RedemptionForm/RedemptionForm';
import ChatInterface from './components/ChatInterface/ChatInterface';
import FilePreviewModal from './components/modals/FilePreviewModal';
import EmailModal from './components/modals/EmailModal';
import Toast from './components/common/Toast';

export default function App() {
  // Create OrchestratorAgent once — pass the Zustand store object
  const orchestratorRef = useRef(null);
  if (!orchestratorRef.current) {
    orchestratorRef.current = new OrchestratorAgent(useWorkflowStore);
  }
  const orchestrator = orchestratorRef.current;

  return (
    <div className="app-root">
      <TopBar />

      <div className="app-body">
        {/* Left Column — Upload & Signature */}
        <LeftPanel orchestrator={orchestrator} />

        {/* Center Column — Redemption Form */}
        <RedemptionForm orchestrator={orchestrator} />

        {/* Right Column — Chat */}
        <ChatInterface orchestrator={orchestrator} />
      </div>

      {/* Modals */}
      <FilePreviewModal />
      <EmailModal orchestrator={orchestrator} />

      {/* Toasts */}
      <Toast />
    </div>
  );
}
