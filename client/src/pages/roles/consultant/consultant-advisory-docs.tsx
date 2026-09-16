import { FormEvent, useMemo, useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  FolderOpen,
  Search,
  Upload,
  X,
} from "lucide-react";

import { PageContainer } from "@/components/refine-ui/views/page-container";
import { PageHeader } from "@/components/refine-ui/views/page-header";
import { PageContent } from "@/components/refine-ui/views/page-content";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useFieldDocuments } from "@/features/documents/hooks/use-field-documents";

const DOCUMENT_TYPES = [
  "Field Report",
  "Site Photo",
  "Progress Evidence",
  "Supporting Document",
] as const;

type DocumentType = (typeof DOCUMENT_TYPES)[number];

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}

export default function AdvisoryDocsPage() {
  const {
    documents,
    loading,
    error,
    uploading,
    upload,
  } = useFieldDocuments();

  const [showUpload, setShowUpload] = useState(false);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const [title, setTitle] = useState("");
  const [project, setProject] = useState("");
  const [type, setType] =
    useState<DocumentType>("Supporting Document");
  const [version, setVersion] = useState("v1");
  const [file, setFile] = useState<File | null>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(
    null,
  );

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return documents.filter((document) => {
      const matchesSearch =
        !query ||
        document.documentId.toLowerCase().includes(query) ||
        document.title.toLowerCase().includes(query) ||
        document.project.toLowerCase().includes(query) ||
        document.type.toLowerCase().includes(query) ||
        document.uploadedBy?.toLowerCase().includes(query);

      const matchesType =
        typeFilter === "all" ||
        document.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [documents, search, typeFilter]);

  function resetForm() {
    setTitle("");
    setProject("");
    setType("Supporting Document");
    setVersion("v1");
    setFile(null);
  }

  function openUploadDialog() {
    setSuccessMessage(null);
    setShowUpload(true);
  }

  function closeUploadDialog() {
    if (uploading) {
      return;
    }

    setShowUpload(false);
  }

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      !title.trim() ||
      !project.trim() ||
      !file
    ) {
      return;
    }

    setSuccessMessage(null);

    try {
      await upload({
        file,
        title: title.trim(),
        project: project.trim(),
        type,
        version: version.trim() || "v1",
      });

      resetForm();
      setShowUpload(false);

      setSuccessMessage(
        "Advisory document submitted successfully.",
      );
    } catch {
      // Error is handled by useFieldDocuments.
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Advisory Documents"
        description="Review and manage consultant advisory documents, recommendations, and technical reports."
      />

      <PageContent className="p-4 md:p-6 lg:p-8">
        <div className="space-y-6">

          {/* ====================================================== */}
          {/* TOP ACTION */}
          {/* ====================================================== */}

          <div className="flex justify-end">
            <Button
              onClick={openUploadDialog}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload Advisory
            </Button>
          </div>

          {/* ====================================================== */}
          {/* SUCCESS MESSAGE */}
          {/* ====================================================== */}

          {successMessage && (
            <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />

              <p className="text-sm">
                {successMessage}
              </p>

              <button
                type="button"
                className="ml-auto"
                onClick={() => setSuccessMessage(null)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* ====================================================== */}
          {/* ERROR */}
          {/* ====================================================== */}

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
              <p className="text-sm text-destructive">
                {error}
              </p>
            </div>
          )}

          {/* ====================================================== */}
          {/* CONSULTANT WORKSPACE */}
          {/* ====================================================== */}

          <Card>
            <CardContent className="p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted">
                  <FileText className="h-6 w-6" />
                </div>

                <div>
                  <h2 className="text-lg font-semibold">
                    Consultant Advisory Workspace
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Use this workspace to review recommendation
                    reports, technical advisories, design reviews,
                    and other project-related advisory documents.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ====================================================== */}
          {/* SEARCH + FILTER */}
          {/* ====================================================== */}

          <Card>
            <CardContent className="p-5">
              <div className="flex flex-col gap-3 md:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search advisory documents..."
                    className="pl-9"
                  />
                </div>

                <Select
                  value={typeFilter}
                  onValueChange={setTypeFilter}
                >
                  <SelectTrigger className="w-full md:w-[240px]">
                    <SelectValue placeholder="All document types" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">
                      All document types
                    </SelectItem>

                    {DOCUMENT_TYPES.map((documentType) => (
                      <SelectItem
                        key={documentType}
                        value={documentType}
                      >
                        {documentType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* ====================================================== */}
          {/* DOCUMENT LIST */}
          {/* ====================================================== */}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  Advisory Documents
                </CardTitle>

                <Badge variant="secondary">
                  {filteredDocuments.length}
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                    Loading advisory documents...
                  </div>
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <FileText className="mb-4 h-10 w-10 text-muted-foreground" />

                  <h3 className="font-medium">
                    No advisory documents found
                  </h3>

                  <p className="mt-1 max-w-md text-sm text-muted-foreground">
                    There are currently no documents matching
                    your search or filter.
                  </p>

                  <Button
                    className="mt-5"
                    onClick={openUploadDialog}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Advisory
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px]">
                    <thead>
                      <tr className="border-b text-left text-sm">
                        <th className="px-4 py-3 font-medium">
                          Document
                        </th>

                        <th className="px-4 py-3 font-medium">
                          Project
                        </th>

                        <th className="px-4 py-3 font-medium">
                          Type
                        </th>

                        <th className="px-4 py-3 font-medium">
                          Version
                        </th>

                        <th className="px-4 py-3 font-medium">
                          Uploaded By
                        </th>

                        <th className="px-4 py-3 font-medium">
                          Date
                        </th>

                        <th className="px-4 py-3 text-right font-medium">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredDocuments.map((document) => (
                        <tr
                          key={document.id}
                          className="border-b last:border-0"
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                              </div>

                              <div>
                                <p className="font-medium">
                                  {document.title}
                                </p>

                                <p className="text-xs text-muted-foreground">
                                  {document.documentId}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4 text-sm">
                            {document.project || "—"}
                          </td>

                          <td className="px-4 py-4">
                            <Badge variant="outline">
                              {document.type}
                            </Badge>
                          </td>

                          <td className="px-4 py-4 text-sm">
                            {document.version || "—"}
                          </td>

                          <td className="px-4 py-4 text-sm">
                            {document.uploadedBy || "—"}
                          </td>

                          <td className="px-4 py-4 text-sm text-muted-foreground">
                            {formatDate(document.createdAt)}
                          </td>

                          <td className="px-4 py-4 text-right">
                            {document.fileUrl ? (
                              <Button
                                asChild
                                variant="outline"
                                size="sm"
                              >
                                <a
                                  href={document.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <ExternalLink className="mr-2 h-4 w-4" />
                                  Open
                                </a>
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                No file
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageContent>

      {/* ======================================================== */}
      {/* UPLOAD ADVISORY MODAL */}
      {/* ======================================================== */}

      {showUpload && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeUploadDialog();
            }
          }}
        >
          <div
            className="w-full max-w-2xl rounded-xl border bg-background shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="upload-advisory-title"
          >
            {/* Modal header */}
            <div className="flex items-center justify-between border-b px-6 py-5">
              <div>
                <h2
                  id="upload-advisory-title"
                  className="text-lg font-semibold"
                >
                  Upload Advisory
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Add a consultant advisory document to a project.
                </p>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={closeUploadDialog}
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleUpload}>
              <div className="space-y-5 px-6 py-6">

                {/* Document title */}
                <div className="space-y-2">
                  <label
                    htmlFor="advisory-title"
                    className="text-sm font-medium"
                  >
                    Document Title
                  </label>

                  <Input
                    id="advisory-title"
                    value={title}
                    onChange={(event) =>
                      setTitle(event.target.value)
                    }
                    placeholder="e.g. Structural Design Review"
                    required
                  />
                </div>

                {/* Project */}
                <div className="space-y-2">
                  <label
                    htmlFor="advisory-project"
                    className="text-sm font-medium"
                  >
                    Project
                  </label>

                  <Input
                    id="advisory-project"
                    value={project}
                    onChange={(event) =>
                      setProject(event.target.value)
                    }
                    placeholder="e.g. PRJ-001"
                    required
                  />
                </div>

                {/* Type + version */}
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <label
                      htmlFor="advisory-type"
                      className="text-sm font-medium"
                    >
                      Document Type
                    </label>

                    <Select
                      value={type}
                      onValueChange={(value) =>
                        setType(value as DocumentType)
                      }
                    >
                      <SelectTrigger id="advisory-type">
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        {DOCUMENT_TYPES.map((documentType) => (
                          <SelectItem
                            key={documentType}
                            value={documentType}
                          >
                            {documentType}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="advisory-version"
                      className="text-sm font-medium"
                    >
                      Version
                    </label>

                    <Input
                      id="advisory-version"
                      value={version}
                      onChange={(event) =>
                        setVersion(event.target.value)
                      }
                      placeholder="v1"
                      maxLength={10}
                    />
                  </div>
                </div>

                {/* Actual file */}
                <div className="space-y-2">
                  <label
                    htmlFor="advisory-file"
                    className="text-sm font-medium"
                  >
                    File
                  </label>

                  <Input
                    id="advisory-file"
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg"
                    onChange={(event) =>
                      setFile(
                        event.target.files?.[0] ??
                          null,
                      )
                    }
                  />

                  <p className="text-xs text-muted-foreground">
                    PDF, Word, Excel, PowerPoint, PNG, and JPG
                    files up to 10 MB are supported.
                  </p>

                  {file && (
                    <p className="text-sm text-muted-foreground">
                      Selected file: {file.name}
                    </p>
                  )}
                </div>
              </div>

              {/* Modal footer */}
              <div className="flex justify-end gap-3 border-t px-6 py-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeUploadDialog}
                  disabled={uploading}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={
                    uploading ||
                    !title.trim() ||
                    !project.trim() ||
                    !file
                  }
                >
                  <Upload className="mr-2 h-4 w-4" />

                  {uploading
                    ? "Uploading..."
                    : "Upload Advisory"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

AdvisoryDocsPage.displayName = "AdvisoryDocsPage";