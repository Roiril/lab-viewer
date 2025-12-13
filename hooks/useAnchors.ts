"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { AnchorPoint, AnchorRow } from "@/types";

export const useAnchors = () => {
  const [anchors, setAnchors] = useState<AnchorPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnchors = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from("anchors")
        .select("*");

      if (fetchError) throw fetchError;

      const mapped: AnchorPoint[] = (data ?? []).map((item: AnchorRow) => ({
        id: item.id,
        position: [item.position_x, item.position_y, item.position_z],
        label: item.label,
        description: item.description,
        color: item.color || "orange",
      }));

      setAnchors(mapped);
      return mapped;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "アンカーの取得に失敗しました";
      setError(errorMessage);
      console.error("Error fetching anchors:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createAnchor = useCallback(
    async (anchor: Omit<AnchorPoint, "id">) => {
      try {
        setIsLoading(true);
        setError(null);
        const { data, error: createError } = await supabase
          .from("anchors")
          .insert([
            {
              label: anchor.label,
              description: anchor.description,
              color: anchor.color,
              position_x: anchor.position[0],
              position_y: anchor.position[1],
              position_z: anchor.position[2],
            },
          ])
          .select();

        if (createError) throw createError;

        if (data && data.length > 0) {
          const newAnchor: AnchorPoint = {
            id: data[0].id,
            position: [
              data[0].position_x,
              data[0].position_y,
              data[0].position_z,
            ],
            label: data[0].label,
            description: data[0].description,
            color: data[0].color,
          };
          setAnchors((prev) => [...prev, newAnchor]);
          return newAnchor;
        }
        return null;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "アンカーの作成に失敗しました";
        setError(errorMessage);
        console.error("Error creating anchor:", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateAnchor = useCallback(
    async (
      id: string,
      updates: Partial<Pick<AnchorPoint, "label" | "description" | "position">>
    ) => {
      try {
        setIsLoading(true);
        setError(null);
        const updateData: Record<string, unknown> = {};
        if (updates.label !== undefined) updateData.label = updates.label;
        if (updates.description !== undefined)
          updateData.description = updates.description;
        if (updates.position !== undefined) {
          updateData.position_x = updates.position[0];
          updateData.position_y = updates.position[1];
          updateData.position_z = updates.position[2];
        }

        const { error: updateError } = await supabase
          .from("anchors")
          .update(updateData)
          .eq("id", id);

        if (updateError) throw updateError;

        setAnchors((prev) =>
          prev.map((a) =>
            a.id === id
              ? {
                  ...a,
                  ...updates,
                }
              : a
          )
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "アンカーの更新に失敗しました";
        setError(errorMessage);
        console.error("Error updating anchor:", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deleteAnchor = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const { error: deleteError } = await supabase
        .from("anchors")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      setAnchors((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "アンカーの削除に失敗しました";
      setError(errorMessage);
      console.error("Error deleting anchor:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    anchors,
    isLoading,
    error,
    fetchAnchors,
    createAnchor,
    updateAnchor,
    deleteAnchor,
    setAnchors,
  };
};

