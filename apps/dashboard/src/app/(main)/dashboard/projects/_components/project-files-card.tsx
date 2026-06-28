"use client";

import { useEffect, useState } from "react";

import { Download, FileText, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getProjectDocuments } from "@/lib/db";
import type { ProjectDocument } from "@/lib/types";

interface ProjectFilesCardProps {
  projectId: string;
  organizationId: string;
}

const TYPE_LABELS: Record<ProjectDocument["type"], string> = {
  contract: "Contract",
};

export function ProjectFilesCard({
  projectId,
  organizationId,
}: ProjectFilesCardProps) {
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void (async () => {
      const docs = await getProjectDocuments(organizationId, projectId);
      if (!active) return;
      setDocuments(docs);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [organizationId, projectId]);

  return (
    <Card variant="panel" className="col-span-6">
      <CardHeader>
        <CardTitle>
          <FileText className="icons" />
          Project Files
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 text-sm">
        {loading ? (
          <div className="flex items-center justify-center px-4 py-10 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-10 text-center text-muted-foreground">
            <FileText className="mb-2 size-10 text-muted-foreground/30" />
            <p className="text-xs">No files yet.</p>
            <p className="mt-1 max-w-xs text-[11px] text-muted-foreground/70">
              Documents appear here automatically once they are fully executed.
            </p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="text-xs uppercase tracking-wider">
                  <TableHead>Document</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((document) => (
                  <TableRow
                    key={document.documentId}
                    className="group hover:bg-muted/30"
                  >
                    <TableCell className="py-4 font-medium font-serif text-foreground">
                      {document.title}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {TYPE_LABELS[document.type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(document.createdAt).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        },
                      )}
                    </TableCell>
                    <TableCell>
                      <Button asChild size="sm" variant="secondary">
                        <a href={document.fileUrl}>
                          <Download className="size-3" />
                          Download
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/*
            <div className="flex flex-col w-full h-32 justify-end">
              <div className="w-full h-full bg-muted flex items-center justify-center rounded-lg">
                <ReceiptText className="size-30 stroke-1" />
              </div>
              <div className="mt-4 self-end">
                <Ellipsis size={16} />
              </div>
            </div> */}
          </>
        )}
      </CardContent>
    </Card>
  );
}
