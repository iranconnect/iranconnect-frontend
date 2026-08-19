import {
  useEffect,
  useRef,
  useState,
} from "react";

export default function RevealOnScroll({
  children,
  className = "",
  delayMs = 0,
  threshold = 0.12,
  rootMargin = "0px 0px -8% 0px",
}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] =
    useState(false);

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    if (
      typeof IntersectionObserver ===
      "undefined"
    ) {
      setIsVisible(true);
      return;
    }

    const observer =
      new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) {
            return;
          }

          setIsVisible(true);
          observer.disconnect();
        },
        {
          threshold,
          rootMargin,
        }
      );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [
    rootMargin,
    threshold,
  ]);

  const safeDelay = Math.min(
    Math.max(delayMs, 0),
    180
  );

  return (
    <div
      ref={ref}
      className={`
        ${className}
        transition-[opacity,transform]
        duration-[620ms]
        md:duration-[720ms]
        ease-[cubic-bezier(0.22,1,0.36,1)]
        transform-gpu
        motion-reduce:opacity-100
        motion-reduce:translate-y-0
        motion-reduce:transition-none
        ${
          isVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-3 md:translate-y-5"
        }
      `}
      style={{
        transitionDelay: isVisible
          ? `${safeDelay}ms`
          : "0ms",
      }}
    >
      {children}
    </div>
  );
}
