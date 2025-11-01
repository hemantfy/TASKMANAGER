import React from "react";

import DashboardLayout from "../../components/layouts/DashboardLayout";
import DocumentsWorkspace from "../../components/documents/DocumentsWorkspace";

const Documents = () => {
  return (
    <DashboardLayout activeMenu="Documents">
      <DocumentsWorkspace />
    </DashboardLayout>
  );
};

export default Documents;