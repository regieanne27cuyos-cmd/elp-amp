import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "../lib/supabase";
import useTeacherClasses from "./useTeacherClasses";

export default function useTeacherLearningMaterials() {
  const {
    classes,
    loading: classesLoading,
    error: classesError,
    reload: reloadClasses,
  } = useTeacherClasses();

  const [modules, setModules] = useState([]);
  const [resources, setResources] =
    useState([]);
  const [loadingMaterials, setLoadingMaterials] =
    useState(false);
  const [materialsError, setMaterialsError] =
    useState("");

  const assignmentIds = useMemo(
    () =>
      classes
        .map((classRecord) => classRecord.id)
        .filter(Boolean),
    [classes],
  );

  const loadMaterials = useCallback(
    async () => {
      if (classesLoading) return;

      if (classesError) {
        setMaterialsError(classesError);
        setModules([]);
        setResources([]);
        return;
      }

      if (assignmentIds.length === 0) {
        setModules([]);
        setResources([]);
        setMaterialsError("");
        return;
      }

      setLoadingMaterials(true);
      setMaterialsError("");

      try {
        const {
          data: moduleData,
          error: moduleError,
        } = await supabase
          .from("learning_modules")
          .select(`
            id,
            teaching_assignment_id,
            title,
            description,
            status,
            created_at,
            updated_at
          `)
          .in(
            "teaching_assignment_id",
            assignmentIds,
          )
          .order("created_at", {
            ascending: false,
          });

        if (moduleError) {
          throw moduleError;
        }

        const loadedModules =
          moduleData || [];

        const moduleIds = loadedModules.map(
          (module) => module.id,
        );

        if (moduleIds.length === 0) {
          setModules(loadedModules);
          setResources([]);
          return;
        }

        const {
          data: resourceData,
          error: resourceError,
        } = await supabase
          .from("module_resources")
          .select(`
            id,
            module_id,
            resource_type,
            file_name,
            file_path,
            file_type,
            file_size,
            external_url,
            created_at
          `)
          .in("module_id", moduleIds)
          .order("created_at", {
            ascending: true,
          });

        if (resourceError) {
          throw resourceError;
        }

        setModules(loadedModules);
        setResources(resourceData || []);
      } catch (loadError) {
        console.error(
          "Failed to load teacher materials:",
          loadError,
        );

        setModules([]);
        setResources([]);

        setMaterialsError(
          loadError.message ||
            "Unable to load learning materials.",
        );
      } finally {
        setLoadingMaterials(false);
      }
    },
    [
      assignmentIds,
      classesError,
      classesLoading,
    ],
  );

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  const reload = useCallback(async () => {
    await reloadClasses();
    await loadMaterials();
  }, [reloadClasses, loadMaterials]);

  const materials = useMemo(() => {
    const classById = new Map(
      classes.map((classRecord) => [
        classRecord.id,
        classRecord,
      ]),
    );

    const resourcesByModule = new Map();

    resources.forEach((resource) => {
      if (
        !resourcesByModule.has(
          resource.module_id,
        )
      ) {
        resourcesByModule.set(
          resource.module_id,
          [],
        );
      }

      resourcesByModule
        .get(resource.module_id)
        .push(resource);
    });

    return modules
      .map((module) => {
        const classRecord =
          classById.get(
            module.teaching_assignment_id,
          ) || null;

        return {
          ...module,
          classRecord,
          resources:
            resourcesByModule.get(module.id) ||
            [],
        };
      })
      .filter((module) => module.classRecord);
  }, [classes, modules, resources]);

  return {
    materials,
    classes,
    loading:
      classesLoading || loadingMaterials,
    error: classesError || materialsError,
    reload,
  };
}