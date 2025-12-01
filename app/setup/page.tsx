"use client";

import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { DirectoryTreeView, type DirectoryTreeNode } from "@/components/directory-tree-view";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const steps = ["Welcome", "Create Admin Account", "Add Library Paths", "Confirmation"];

type AdminDetails = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type WizardData = {
  admin: AdminDetails;
  libraryPaths: string[];
};

type DirectoryListingEntry = {
  name: string;
  fullPath: string;
};

const buildNodes = (entries: DirectoryListingEntry[]): DirectoryTreeNode[] =>
  entries.map((entry) => ({
    name: entry.name,
    fullPath: entry.fullPath,
    children: [],
    isExpanded: false,
    isLoading: false,
    hasLoaded: false,
  }));

const updateNodeByPath = (
  node: DirectoryTreeNode,
  targetPath: string,
  updater: (node: DirectoryTreeNode) => DirectoryTreeNode,
): DirectoryTreeNode => {
  if (node.fullPath === targetPath) {
    return updater(node);
  }

  return {
    ...node,
    children: node.children.map((child) => updateNodeByPath(child, targetPath, updater)),
  };
};

const findNodeByPath = (
  node: DirectoryTreeNode | null,
  targetPath: string,
): DirectoryTreeNode | null => {
  if (!node) return null;
  if (node.fullPath === targetPath) return node;

  for (const child of node.children) {
    const found = findNodeByPath(child, targetPath);
    if (found) return found;
  }

  return null;
};

export default function AdminSetupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPath, setSelectedPath] = useState("");
  const [rootNode, setRootNode] = useState<DirectoryTreeNode | null>(null);
  const [isLoadingPaths, setIsLoadingPaths] = useState(false);
  const [browseError, setBrowseError] = useState<string | null>(null);
  const [hasLoadedInitialPath, setHasLoadedInitialPath] = useState(false);
  const [data, setData] = useState<WizardData>({
    admin: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    libraryPaths: [],
  });

  const canProceed = useMemo(() => {
    if (currentStep === 1) {
      const { username, password, confirmPassword } = data.admin;
      return Boolean(
        username.trim() && password && confirmPassword && password === confirmPassword,
      );
    }

    if (currentStep === 2) {
      return data.libraryPaths.length > 0;
    }

    return true;
  }, [currentStep, data.admin, data.libraryPaths]);

  const goNext = () => {
    setError(null);

    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const goBack = () => {
    setError(null);
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const updateAdminField = (field: keyof AdminDetails, value: string) => {
    setData((prev) => ({
      ...prev,
      admin: {
        ...prev.admin,
        [field]: value,
      },
    }));
  };

  const addLibraryPath = (path?: string) => {
    const trimmedPath = (path ?? selectedPath).trim();

    if (!trimmedPath) {
      setError("Select a folder to continue.");
      return false;
    }

    setData((prev) => ({
      ...prev,
      libraryPaths: prev.libraryPaths.includes(trimmedPath)
        ? prev.libraryPaths
        : [...prev.libraryPaths, trimmedPath],
    }));

    setError(null);
    return true;
  };

  const removeLibraryPath = (index: number) => {
    setData((prev) => ({
      ...prev,
      libraryPaths: prev.libraryPaths.filter((_, i) => i !== index),
    }));
  };

  const applyListingToTree = useCallback((resolvedPath: string, directories: DirectoryTreeNode[]) => {
      setRootNode((previous) => {
        if (!previous) {
          return {
            name: resolvedPath || "Root",
            fullPath: resolvedPath,
            children: directories,
            isExpanded: true,
            isLoading: false,
            hasLoaded: true,
          };
        }

        return updateNodeByPath(previous, resolvedPath, (node) => ({
          ...node,
          isExpanded: true,
          isLoading: false,
          hasLoaded: true,
          children: directories,
        }));
      });

      setSelectedPath(resolvedPath);
    },
    [],
  );

  const loadDirectory = useCallback(
    async (targetPath?: string) => {
      setIsLoadingPaths(true);
      setBrowseError(null);

      try {
        const query = targetPath ? `?path=${encodeURIComponent(targetPath)}` : "";
        const response = await fetch(`/api/fs/list${query}`);

        if (!response.ok) {
          const body = await response.json().catch(() => null);
          const message = body?.message || "Unable to load directories.";
          throw new Error(message);
        }

        const body = await response.json();
        const resolvedPath = body.path ?? "";
        const directories = Array.isArray(body.directories) ? buildNodes(body.directories) : [];
        applyListingToTree(resolvedPath, directories);
      } catch (requestError) {
        const message =
          requestError instanceof Error
            ? requestError.message
            : "Unable to load directories.";
        setBrowseError(message);
      } finally {
        setIsLoadingPaths(false);
      }
    },
    [applyListingToTree],
  );

  const handleToggleNode = async (path: string) => {
    const existing = findNodeByPath(rootNode, path);
    if (!existing) return;

    if (existing.hasLoaded) {
      setRootNode((previous) =>
        previous ? updateNodeByPath(previous, path, (node) => ({
          ...node,
          isExpanded: !node.isExpanded,
        })) : previous,
      );
      return;
    }

    setRootNode((previous) =>
      previous
        ? updateNodeByPath(previous, path, (node) => ({ ...node, isLoading: true }))
        : previous,
    );

    await loadDirectory(path);

    setRootNode((previous) =>
      previous
        ? updateNodeByPath(previous, path, (node) => ({ ...node, isLoading: false }))
        : previous,
    );
  };

  const handleSelectPath = async (path: string) => {
    await loadDirectory(path);
  };

  useEffect(() => {
    if (currentStep === 2 && !hasLoadedInitialPath) {
      loadDirectory();
      setHasLoadedInitialPath(true);
    }
  }, [currentStep, hasLoadedInitialPath, loadDirectory]);

  const finishSetup = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/setup/library-paths", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paths: data.libraryPaths }),
      });

      if (!response.ok) {
        const responseBody = await response.json().catch(() => null);
        const message = responseBody?.message || "Unable to save library paths.";
        throw new Error(message);
      }

      router.push("/admin");
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Unable to save library paths.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Welcome</h2>
            <p className="text-muted-foreground">
              Follow the steps to complete the initial admin setup. You can update these
              settings later in the admin dashboard.
            </p>
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                autoComplete="username"
                value={data.admin.username}
                onChange={(event) => updateAdminField("username", event.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={data.admin.email}
                onChange={(event) => updateAdminField("email", event.target.value)}
                className="mt-2"
              />
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={data.admin.password}
                  onChange={(event) => updateAdminField("password", event.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={data.admin.confirmPassword}
                  onChange={(event) => updateAdminField("confirmPassword", event.target.value)}
                  className="mt-2"
                />
                {data.admin.confirmPassword &&
                  data.admin.confirmPassword !== data.admin.password && (
                    <p className="mt-2 text-sm text-destructive">
                      Passwords do not match.
                    </p>
                  )}
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Browse the filesystem to choose one or more library folders. Expand directories
              to navigate and select a folder to add it to your library list.
            </p>
            <Card>
              <CardHeader>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Current path</p>
                  <p className="break-all font-semibold text-foreground">
                    {selectedPath || "Loading..."}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {browseError && <p className="text-sm text-destructive">{browseError}</p>}
                <div className="space-y-2 rounded-md border p-2">
                  <DirectoryTreeView
                    root={rootNode}
                    selectedPath={selectedPath}
                    onSelect={handleSelectPath}
                    onToggle={handleToggleNode}
                  />
                  {isLoadingPaths && (
                    <p className="text-xs text-muted-foreground">Loading directories...</p>
                  )}
                </div>
                <div className="flex justify-end">
                  <Button type="button" onClick={() => addLibraryPath(selectedPath)} disabled={!selectedPath}>
                    Select Folder
                  </Button>
                </div>
              </CardContent>
            </Card>
            <div className="space-y-2">
              {data.libraryPaths.length > 0 ? (
                data.libraryPaths.map((path, index) => (
                  <div
                    key={`${path}-${index}`}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <span className="break-all font-medium text-foreground">{path}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={() => removeLibraryPath(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No library paths added yet.</p>
              )}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Account</h3>
              <dl className="mt-2 space-y-1 text-sm text-muted-foreground">
                <div className="flex gap-2">
                  <dt className="font-medium text-foreground">Username:</dt>
                  <dd>{data.admin.username || "Not provided"}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="font-medium text-foreground">Email:</dt>
                  <dd>{data.admin.email || "Not provided"}</dd>
                </div>
              </dl>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Selected Folders</h3>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {data.libraryPaths.length > 0 ? (
                  data.libraryPaths.map((path, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="font-medium text-foreground">Folder {index + 1}:</span>
                      <span>{path || "Not provided"}</span>
                    </li>
                  ))
                ) : (
                  <li>No folders provided.</li>
                )}
              </ul>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto max-w-3xl space-y-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Admin Setup Wizard</h1>
          <p className="text-muted-foreground">
            Complete these steps to finish configuring your installation.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            Step {currentStep + 1} of {steps.length}
          </span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <CardTitle>{steps[currentStep]}</CardTitle>
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              {steps.map((step, index) => (
                <span
                  key={step}
                  className={`flex items-center gap-1 rounded-full px-3 py-1 ${
                    index === currentStep
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-current" />
                  {step}
                </span>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          {renderStepContent()}
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <div className="flex items-center justify-between">
            <Button type="button" variant="outline" onClick={goBack} disabled={currentStep === 0}>
              Back
            </Button>
            {currentStep < steps.length - 1 ? (
              <Button
                type="button"
                onClick={goNext}
                disabled={!canProceed || isSubmitting}
              >
                Next
              </Button>
            ) : (
              <Button type="button" onClick={finishSetup} disabled={isSubmitting}>
                {isSubmitting ? "Finishing..." : "Finish"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
