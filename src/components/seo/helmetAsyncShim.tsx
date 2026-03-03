import { Children, isValidElement, type ReactElement, type ReactNode, useEffect } from 'react';

export function HelmetProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

function setAttributes(element: HTMLElement, props: Record<string, unknown>) {
  for (const [key, value] of Object.entries(props)) {
    if (key === 'children' || value === undefined || value === null) continue;
    element.setAttribute(key, String(value));
  }
}

export function Helmet({ children }: { children?: ReactNode }) {
  useEffect(() => {
    const nodes = Children.toArray(children).filter(isValidElement) as ReactElement<Record<string, unknown>>[];
    const cleanup: HTMLElement[] = [];
    const previousTitle = document.title;

    for (const node of nodes) {
      const type = typeof node.type === 'string' ? node.type : '';
      const props = node.props ?? {};

      if (type === 'title') {
        const titleText = typeof props.children === 'string' ? props.children : '';
        if (titleText) document.title = titleText;
        continue;
      }

      if (type === 'meta' || type === 'link' || type === 'script') {
        const element = document.createElement(type);
        setAttributes(element, props);
        if (type === 'script' && typeof props.children === 'string') {
          element.textContent = props.children;
        }
        element.setAttribute('data-helmet-shim', 'true');
        document.head.appendChild(element);
        cleanup.push(element);
      }
    }

    return () => {
      document.title = previousTitle;
      for (const element of cleanup) element.remove();
    };
  }, [children]);

  return null;
}

