import React from "react";

import { Route, Routes } from "react-router-dom";

import DashboardLayout from "../../components/layouts/DashboardLayout";
import DocumentsWorkspace from "../../components/documents/DocumentsWorkspace";

const OwnerDocuments = () => {
  return (
    <DashboardLayout activeMenu="Documents">
      <Routes>
        <Route
          index
          element={<DocumentsWorkspace basePath="/owner/documents" />}
        />
        <Route
          path=":matterId"
          element={<DocumentsWorkspace basePath="/owner/documents" />}
        />
        <Route
          path=":matterId/cases/:caseId"
          element={<DocumentsWorkspace basePath="/owner/documents" />}
        />
      </Routes>
    </DashboardLayout>
  );
};

export default OwnerDocuments;