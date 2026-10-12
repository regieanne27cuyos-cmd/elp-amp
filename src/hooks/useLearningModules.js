import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { supabase } from "../lib/supabase";

const BUCKET_NAME = "learning-materials";

function sanitizeFileName(fileName) {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-");
}

function normalizeModule(module) {
  return {
    ...module,
    resources: Array.isArray(module.resources)
      ? module.resources
      : [],
  };
}

export default function useLearningModules(
  teachingAssignmentId,
) {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] =
    useState(true);
  const [saving, setSaving] =
    useState(false);
  const [error, setError] = useState("");

  const loadModules = useCallback(async () => {
    if (!teachingAssignmentId) {
      setModules([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const {
        data,
        error: modulesError,
      } = await supabase
        .from("learning_modules")
        .select(`
          id,
          teaching_assignment_id,
          teacher_id,
          title,
          description,
          grading_period,
          status,
          publish_at,
          created_at,
          updated_at,
          resources:module_resources (
            id,
            module_id,
            resource_type,
            file_path,
            file_name,
            file_type,
            file_size,
            external_url,
            link_label,
            created_at
          )
        `)
        .eq(
          "teaching_assignment_id",
          teachingAssignmentId,
        )
        .order("grading_period", {
          ascending: true,
        })
        .order("created_at", {
          ascending: false,
        });

      if (modulesError) {
        throw modulesError;
      }

      setModules(
        (data || []).map(normalizeModule),
      );
    } catch (loadError) {
      console.error(
        "Failed to load learning modules:",
        loadError,
      );

      setError(
        loadError.message ||
          "Unable to load learning modules.",
      );
    } finally {
      setLoading(false);
    }
  }, [teachingAssignmentId]);

  useEffect(() => {
    loadModules();
  }, [loadModules]);

  async function getCurrentTeacherId() {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw (
        userError ||
        new Error(
          "Your session has expired. Please sign in again.",
        )
      );
    }

    return user.id;
  }

  async function uploadFiles({
    files,
    teacherId,
    moduleId,
  }) {
    const uploadedResources = [];
    const uploadedPaths = [];

    try {
      for (const file of files) {
        const safeName =
          sanitizeFileName(file.name);

        const uniqueName = `${
          crypto.randomUUID?.() ||
          `${Date.now()}-${Math.random()}`
        }-${safeName}`;

        const filePath = [
          teacherId,
          teachingAssignmentId,
          moduleId,
          uniqueName,
        ].join("/");

        const {
          error: uploadError,
        } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType:
              file.type ||
              "application/octet-stream",
          });

        if (uploadError) {
          throw uploadError;
        }

        uploadedPaths.push(filePath);

        uploadedResources.push({
          module_id: moduleId,
          resource_type: "file",
          file_path: filePath,
          file_name: file.name,
          file_type:
            file.type ||
            "application/octet-stream",
          file_size: file.size,
          external_url: null,
          link_label: null,
        });
      }

      return {
        uploadedResources,
        uploadedPaths,
      };
    } catch (uploadError) {
      if (uploadedPaths.length > 0) {
        await supabase.storage
          .from(BUCKET_NAME)
          .remove(uploadedPaths);
      }

      throw uploadError;
    }
  }

  function createLinkResources(
    links,
    moduleId,
  ) {
    return links
      .filter((link) =>
        String(link.url || "").trim(),
      )
      .map((link) => ({
        module_id: moduleId,
        resource_type: "link",
        file_path: null,
        file_name: null,
        file_type: null,
        file_size: null,
        external_url: link.url.trim(),
        link_label:
          link.label?.trim() ||
          link.url.trim(),
      }));
  }

  async function saveModule({
    moduleId,
    title,
    description,
    gradingPeriod,
    status,
    publishAt,
    files = [],
    links = [],
    removedResourceIds = [],
  }) {
    setSaving(true);
    setError("");

    let createdModuleId = null;
    let uploadedPaths = [];

    try {
      const teacherId =
        await getCurrentTeacherId();

      const modulePayload = {
        teaching_assignment_id:
          teachingAssignmentId,
        teacher_id: teacherId,
        title: title.trim(),
        description:
          description?.trim() || null,
        grading_period: Number(
          gradingPeriod,
        ),
        status,
        publish_at: publishAt
          ? new Date(publishAt).toISOString()
          : null,
      };

      let savedModule;

      if (moduleId) {
        const {
          data,
          error: updateError,
        } = await supabase
          .from("learning_modules")
          .update({
            title: modulePayload.title,
            description:
              modulePayload.description,
            grading_period:
              modulePayload.grading_period,
            status: modulePayload.status,
            publish_at:
              modulePayload.publish_at,
          })
          .eq("id", moduleId)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        savedModule = data;
      } else {
        const {
          data,
          error: insertError,
        } = await supabase
          .from("learning_modules")
          .insert(modulePayload)
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        savedModule = data;
        createdModuleId = data.id;
      }

      const finalModuleId =
        savedModule.id;

      if (removedResourceIds.length > 0) {
        const resourcesToRemove =
          modules
            .flatMap(
              (module) =>
                module.resources || [],
            )
            .filter((resource) =>
              removedResourceIds.includes(
                resource.id,
              ),
            );

        const pathsToRemove =
          resourcesToRemove
            .filter(
              (resource) =>
                resource.resource_type ===
                  "file" &&
                resource.file_path,
            )
            .map(
              (resource) =>
                resource.file_path,
            );

        const {
          error: deleteResourceError,
        } = await supabase
          .from("module_resources")
          .delete()
          .in(
            "id",
            removedResourceIds,
          );

        if (deleteResourceError) {
          throw deleteResourceError;
        }

        if (pathsToRemove.length > 0) {
          const {
            error: storageDeleteError,
          } = await supabase.storage
            .from(BUCKET_NAME)
            .remove(pathsToRemove);

          if (storageDeleteError) {
            console.error(
              "Some removed module files could not be deleted:",
              storageDeleteError,
            );
          }
        }
      }

      const {
        uploadedResources,
        uploadedPaths:
          newlyUploadedPaths,
      } = await uploadFiles({
        files,
        teacherId,
        moduleId: finalModuleId,
      });

      uploadedPaths =
        newlyUploadedPaths;

      const linkResources =
        createLinkResources(
          links,
          finalModuleId,
        );

      const newResources = [
        ...uploadedResources,
        ...linkResources,
      ];

      if (newResources.length > 0) {
        const {
          error: resourceInsertError,
        } = await supabase
          .from("module_resources")
          .insert(newResources);

        if (resourceInsertError) {
          throw resourceInsertError;
        }
      }

      await loadModules();

      return savedModule;
    } catch (saveError) {
      console.error(
        "Failed to save learning module:",
        saveError,
      );

      if (uploadedPaths.length > 0) {
        await supabase.storage
          .from(BUCKET_NAME)
          .remove(uploadedPaths);
      }

      if (createdModuleId) {
        await supabase
          .from("learning_modules")
          .delete()
          .eq("id", createdModuleId);
      }

      const message =
        saveError.message ||
        "Unable to save the learning module.";

      setError(message);
      throw new Error(message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteModule(module) {
    const confirmed = window.confirm(
      `Delete "${module.title}"? Its uploaded files and links will also be removed.`,
    );

    if (!confirmed) return false;

    setSaving(true);
    setError("");

    try {
      const filePaths = (
        module.resources || []
      )
        .filter(
          (resource) =>
            resource.resource_type ===
              "file" &&
            resource.file_path,
        )
        .map(
          (resource) =>
            resource.file_path,
        );

      const {
        error: deleteError,
      } = await supabase
        .from("learning_modules")
        .delete()
        .eq("id", module.id);

      if (deleteError) {
        throw deleteError;
      }

      if (filePaths.length > 0) {
        const {
          error: storageError,
        } = await supabase.storage
          .from(BUCKET_NAME)
          .remove(filePaths);

        if (storageError) {
          console.error(
            "Module deleted but some files remain in Storage:",
            storageError,
          );
        }
      }

      setModules((current) =>
        current.filter(
          (item) => item.id !== module.id,
        ),
      );

      return true;
    } catch (deleteError) {
      console.error(
        "Failed to delete learning module:",
        deleteError,
      );

      setError(
        deleteError.message ||
          "Unable to delete the module.",
      );

      return false;
    } finally {
      setSaving(false);
    }
  }

  async function deleteResource(resource) {
    const confirmed = window.confirm(
      `Remove "${
        resource.file_name ||
        resource.link_label ||
        "this resource"
      }"?`,
    );

    if (!confirmed) return false;

    setSaving(true);
    setError("");

    try {
      const {
        error: deleteError,
      } = await supabase
        .from("module_resources")
        .delete()
        .eq("id", resource.id);

      if (deleteError) {
        throw deleteError;
      }

      if (
        resource.resource_type ===
          "file" &&
        resource.file_path
      ) {
        const {
          error: storageError,
        } = await supabase.storage
          .from(BUCKET_NAME)
          .remove([
            resource.file_path,
          ]);

        if (storageError) {
          console.error(
            "Resource record was removed but its file remains:",
            storageError,
          );
        }
      }

      setModules((current) =>
        current.map((module) => ({
          ...module,
          resources: (
            module.resources || []
          ).filter(
            (item) =>
              item.id !== resource.id,
          ),
        })),
      );

      return true;
    } catch (deleteError) {
      console.error(
        "Failed to delete module resource:",
        deleteError,
      );

      setError(
        deleteError.message ||
          "Unable to delete the resource.",
      );

      return false;
    } finally {
      setSaving(false);
    }
  }

  async function openResource(resource) {
    try {
      if (
        resource.resource_type ===
        "link"
      ) {
        window.open(
          resource.external_url,
          "_blank",
          "noopener,noreferrer",
        );

        return;
      }

      const {
        data,
        error: signedUrlError,
      } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(
          resource.file_path,
          60 * 10,
        );

      if (signedUrlError) {
        throw signedUrlError;
      }

      window.open(
        data.signedUrl,
        "_blank",
        "noopener,noreferrer",
      );
    } catch (openError) {
      console.error(
        "Failed to open resource:",
        openError,
      );

      setError(
        openError.message ||
          "Unable to open the resource.",
      );
    }
  }

  return {
    modules,
    loading,
    saving,
    error,
    reload: loadModules,
    saveModule,
    deleteModule,
    deleteResource,
    openResource,
  };
}