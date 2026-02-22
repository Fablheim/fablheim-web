import type { ReactNode } from 'react';
import { Panel, Group, Separator } from 'react-resizable-panels';

interface SplitPanelProps {
  left: ReactNode;
  right?: ReactNode;
  defaultSplit?: number;
}

export function SplitPanel({ left, right, defaultSplit = 60 }: SplitPanelProps) {
  if (!right) {
    return <div className="h-full overflow-auto">{left}</div>;
  }

  return (
    <Group orientation="horizontal" className="h-full">
      <Panel defaultSize={defaultSplit} minSize={30}>
        <div className="h-full overflow-auto">{left}</div>
      </Panel>

      <Separator className="w-1 cursor-col-resize bg-border transition-colors hover:bg-primary" />

      <Panel defaultSize={100 - defaultSplit} minSize={20}>
        <div className="h-full overflow-auto">{right}</div>
      </Panel>
    </Group>
  );
}
