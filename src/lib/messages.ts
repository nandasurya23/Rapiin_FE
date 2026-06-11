export function renderTemplate(template: string, values: Record<string, string | number | undefined>) {
  return template.replace(/{{(.*?)}}/g, (_, key: string) => {
    const value = values[key.trim()];
    return value === undefined || value === null ? "" : String(value);
  });
}

export function extractTemplateVariables(template: string) {
  const matches = template.match(/{{(.*?)}}/g);
  if (!matches) {
    return [];
  }

  return [...new Set(matches.map((item) => item.replace(/[{}]/g, "").trim()))];
}

