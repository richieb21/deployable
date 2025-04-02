import React, { useState, useEffect, useRef } from "react";
import { easeOutCubic } from "../utils/easing";

const CircleGraph = ({
  metric,
  size = "normal",
  shouldAnimate = false,
}: {
  metric: StatMetric;
  size?: "normal" | "large";
  shouldAnimate?: boolean;
}) => {
  const [mounted, setMounted] = useState(false);
  const [displayValue, setDisplayValue] = useState(0);
  const prevValueRef = useRef(0);
  
  // Animation duration in seconds
  const animationDuration = 1.5;
  
  useEffect(() => {
    setMounted(true);
    if (mounted) {
      setDisplayValue(metric.value);
      prevValueRef.current = metric.value;
    }
  }, []);
  
  // Animate the value when it changes and animation is enabled
  useEffect(() => {
    if (!mounted) return;
    
    // If we shouldn't animate, just set the value directly
    if (!shouldAnimate) {
      setDisplayValue(metric.value);
      prevValueRef.current = metric.value;
      return;
    }
    
    const startValue = prevValueRef.current;
    const endValue = metric.value;
    
    // Only animate if the value has changed
    if (startValue === endValue) return;
    
    const difference = endValue - startValue;
    const startTime = performance.now();
    const endTime = startTime + animationDuration * 1000;
    
    const animateValue = (timestamp: number) => {
      if (timestamp >= endTime) {
        setDisplayValue(endValue);
        prevValueRef.current = endValue;
        return;
      }
      
      const elapsed = timestamp - startTime;
      const progress = elapsed / (animationDuration * 1000);
      const easedProgress = easeOutCubic(progress);
      const currentValue = Math.round(startValue + difference * easedProgress);
      
      setDisplayValue(currentValue);
      requestAnimationFrame(animateValue);
    };
    
    requestAnimationFrame(animateValue);
  }, [metric.value, mounted, shouldAnimate]);
  
  // ... rest of the component remains the same ...
};

export default CircleGraph; 