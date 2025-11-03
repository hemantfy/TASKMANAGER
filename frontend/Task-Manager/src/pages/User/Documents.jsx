import React from "react";
import { Route, Routes } from "react-router-dom";

import DashboardLayout from "../../components/layouts/DashboardLayout";
import DocumentsWorkspace from "../../components/documents/DocumentsWorkspace";

const UserDocuments = () => {
  return (
    <DashboardLayout activeMenu="Documents">
      <Routes>
        <Route
          index
          element={<DocumentsWorkspace basePath="/user/documents" />}
        />
        <Route
          path=":matterId"
          element={<DocumentsWorkspace basePath="/user/documents" />}
        />
        <Route
          path=":matterId/cases/:caseId"
          element={<DocumentsWorkspace basePath="/user/documents" />}
        />
      </Routes>
    </DashboardLayout>
  );
};

export default UserDocuments;