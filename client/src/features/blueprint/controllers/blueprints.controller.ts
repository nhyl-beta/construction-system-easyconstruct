import { useEffect, useMemo, useState } from "react";
import type { Blueprint } from "../types/blueprint.types";

export const useBlueprintsController = () => {
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [folder, setFolder] = useState("all");

  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("search", query);
    if (folder !== "all") params.set("folder", folder);
    setLoading(true);
    fetch(`/api/blueprints?${params.toString()}`)
      .then((res) => res.json())
      .then((json) => setBlueprints(json.data ?? []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [query, folder]);

  const folders = useMemo(() => Array.from(new Set(blueprints.map((b) => b.folder))), [blueprints]);
  const favorites = useMemo(() => blueprints.filter((b) => b.favorite), [blueprints]);

  return { blueprints, favorites, loading, query, setQuery, folder, setFolder, folders };
};