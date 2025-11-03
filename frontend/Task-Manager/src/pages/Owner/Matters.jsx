import React from "react";
import { Route, Routes } from "react-router-dom";

import DashboardLayout from "../../components/layouts/DashboardLayout";
import MattersWorkspace from "../../components/matters/MattersWorkspace";

const OwnerMatters = () => {
  return (
    <DashboardLayout activeMenu="Matters">
      <Routes>
        <Route
          index
          element={<MattersWorkspace basePath="/owner/matters" />}
        />
        <Route
          path=":matterId"
          element={<MattersWorkspace basePath="/owner/matters" />}
        />
        <Route
          path=":matterId/cases/:caseId"
          element={<MattersWorkspace basePath="/owner/matters" />}
        />
      </Routes>
    </DashboardLayout>
  );
};

export default OwnerMatters;