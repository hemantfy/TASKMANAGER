import React from "react";
import InvoicesWorkspace from "../../components/invoices/InvoicesWorkspace";

const OwnerInvoices = () => (
  <InvoicesWorkspace
    viewerRole="owner"
    heading="Revenue Operations"
    description="Stay informed on collections, cash flow, and matter-level billing momentum across the practice."
    showClientDetails
    activeMenu="Invoices"
  />
);

export default OwnerInvoices;