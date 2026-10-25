import { useEffect, useState, useRef } from "react";

export default function useTypewriter(text, speed = 30, enabled = true) {
  const [displayed, setDisplayed] = useState(enabled ? "" : text);
  const [isDone, setIsDone] = useState(!enabled);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!enabled) {
      setDisplayed(text);
      setIsDone(true);
      return;
    }

    let index = 0;
    setDisplayed("");
    setIsDone(false);

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      index += 1;
      setDisplayed(text.slice(0, index));
      if (index >= text.length) {
        clearInterval(intervalRef.current);
        setIsDone(true);
      }
    }, speed);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text, speed, enabled]);

  const skipToEnd = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setDisplayed(text);
    setIsDone(true);
  };

  return { displayed, isDone, skipToEnd };
}
