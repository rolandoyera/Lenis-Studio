import { PageTitle } from "@/components/page-title-updater";

import { ContractBuilder } from "../_components/contract-builder";

export default function NewContractPage() {
  return (
    <>
      <PageTitle title="New Contract" />
      <ContractBuilder />
    </>
  );
}
