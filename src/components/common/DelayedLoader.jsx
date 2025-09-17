import React, { useEffect, useState } from "react";
import Loader from "./Loader";

// DelayedLoader shows the same Loader but ensures it stays visible for
// at least `minMs` milliseconds to create a consistent loading experience.
const DelayedLoader = ({ message = "Loading...", minMs = 2000 }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let mounted = true;
    setShow(true);
    const timer = setTimeout(() => {
      if (mounted) setShow(false);
    }, minMs);
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [minMs]);

  // We render the Loader immediately; the wrapper enforces min display time
  return show ? <Loader message={message} /> : null;
};

export default DelayedLoader;
