import { PageTitle } from "@/components/page-title-updater";

import { ContractBuilder } from "../_components/contract-builder";

interface NewContractPageProps {
  searchParams: Promise<{ projectId?: string }>;
}

export default async function NewContractPage({
  searchParams,
}: NewContractPageProps) {
  const { projectId } = await searchParams;
  return (
    <>
      <PageTitle title="New Contract" />
      <ContractBuilder initialProjectId={projectId} />
    </>
  );
}
