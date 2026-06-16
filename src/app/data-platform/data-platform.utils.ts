export function getDimensionTypeLabel(dimensionType: string): string {
  const map: Record<string, string> = {
    page_type: 'Page type',
    referrer: 'Referrer',
    device: 'Device',
    category: 'Category',
    campaign: 'Campaign',
    action_title: 'Page',
    widget_id: 'Widget',
    event_type: 'Event type',
  };
  return map[dimensionType] ?? dimensionType;
}
