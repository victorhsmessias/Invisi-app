import { useState, useCallback, useRef, useEffect } from "react";
import { SHORT_DELAY } from "../constants/timing";

export const useBackgroundUpdates = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [updateCount, setUpdateCount] = useState(0);
  const updateTimeoutRef = useRef(null);

  const startBackgroundUpdate = useCallback(() => {
    setIsUpdating(true);
    setUpdateCount((prev) => prev + 1);

    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }
  }, []);

  const finishBackgroundUpdate = useCallback(() => {
    setLastUpdateTime(new Date());

    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    updateTimeoutRef.current = setTimeout(() => {
      setIsUpdating(false);
      updateTimeoutRef.current = null;
    }, SHORT_DELAY);
  }, []);

  const cancelBackgroundUpdate = useCallback(() => {
    setIsUpdating(false);
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }
  }, []);

  const shouldShowIndicator = useCallback(() => {
    return isUpdating && updateCount > 1;
  }, [isUpdating, updateCount]);

  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = null;
      }
    };
  }, []);

  return {
    isUpdating,
    lastUpdateTime,
    updateCount,
    startBackgroundUpdate,
    finishBackgroundUpdate,
    cancelBackgroundUpdate,
    shouldShowIndicator,
  };
};

export default useBackgroundUpdates;
