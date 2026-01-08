"use client";

import { useState, useRef } from "react";

export const useAnchorUIState = () => {
    const [isScanning, setIsScanning] = useState(false);
    const [isAddingMode, setIsAddingMode] = useState(false);
    const [selectedAnchorId, setSelectedAnchorId] = useState<string | null>(null);
    const [isEditingAnchor, setIsEditingAnchor] = useState(false);
    const [relocatingAnchorId, setRelocatingAnchorId] = useState<string | null>(null);
    const [tempPosition, setTempPosition] = useState<[number, number, number] | null>(null);
    const [showInputForm, setShowInputForm] = useState(false);
    const [newLabel, setNewLabel] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const isComposing = useRef(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const resetAddMode = () => {
        setIsAddingMode(false);
        setTempPosition(null);
        setShowInputForm(false);
        setNewLabel("");
        setNewDescription("");
    };

    return {
        isScanning,
        setIsScanning,
        isAddingMode,
        setIsAddingMode,
        selectedAnchorId,
        setSelectedAnchorId,
        isEditingAnchor,
        setIsEditingAnchor,
        relocatingAnchorId,
        setRelocatingAnchorId,
        tempPosition,
        setTempPosition,
        showInputForm,
        setShowInputForm,
        newLabel,
        setNewLabel,
        newDescription,
        setNewDescription,
        isSaving,
        setIsSaving,
        isComposing,
        isRefreshing,
        setIsRefreshing,
        errorMessage,
        setErrorMessage,
        resetAddMode,
    };
};
