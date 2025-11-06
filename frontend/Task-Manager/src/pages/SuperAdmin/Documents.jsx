import React from "react";

import { Route, Routes } from "react-router-dom";

import DashboardLayout from "../../components/layouts/DashboardLayout";
import DocumentsWorkspace from "../../components/documents/DocumentsWorkspace";

const SuperAdminDocuments = () => {
  return (
    <DashboardLayout activeMenu="Documents">
      <Routes>
        <Route
          index
          element={<DocumentsWorkspace basePath="/super-admin/documents" />}
        />
        <Route
          path=":matterId"
          element={<DocumentsWorkspace basePath="/super-admin/documents" />}
        />
        <Route
          path=":matterId/cases/:caseId"
          element={<DocumentsWorkspace basePath="/super-admin/documents" />}
        />
      </Routes>
    </DashboardLayout>
  );
};

export default SuperAdminDocuments;