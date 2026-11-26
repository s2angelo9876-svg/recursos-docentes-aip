import { useEffect, useRef } from "react";

const openDialogs = [];

function tabbableElements(dialog) {
  return [...dialog.querySelectorAll(
    'a[href], button, input, select, textarea, iframe, [tabindex], [contenteditable="true"]',
  )].filter((element) => !element.matches(":disabled") && element.tabIndex >= 0 &&
    element.getClientRects().length && !element.closest("[inert]") &&
    getComputedStyle(element).visibility !== "hidden");
}

export function useModalFocus(open, { onClose, initialFocus } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    if (!open || !ref.current) return;
    const dialog = ref.current;
    const previous = document.activeElement;
    openDialogs.push(dialog);
    (initialFocus ? dialog.querySelector(initialFocus) || dialog : dialog).focus();
    return () => {
      const wasTop = openDialogs.at(-1) === dialog;
      openDialogs.splice(openDialogs.lastIndexOf(dialog), 1);
      if (wasTop && previous?.isConnected) previous.focus();
    };
  }, [open, initialFocus]);

  useEffect(() => {
    if (!open) return;
    function onKey(event) {
      const dialog = ref.current;
      if (!dialog || openDialogs.at(-1) !== dialog) return;
      if (event.key === "Escape" && onClose) {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      } else if (event.key === "Tab") {
        const stops = tabbableElements(dialog);
        const first = stops[0];
        const last = stops.at(-1);
        const active = document.activeElement;
        if (!first || !stops.includes(active) || (event.shiftKey ? active === first : active === last)) {
          event.preventDefault();
          ((event.shiftKey ? last : first) || dialog).focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return ref;
}
