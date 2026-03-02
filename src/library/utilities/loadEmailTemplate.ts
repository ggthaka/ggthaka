import * as path from 'path';
import { promises as fs } from 'fs';

export default async function loadEmailTemplate(
  templateName: string,
  data: Record<string, string>
): Promise<API.Success | API.Failure> {
  try {
    const filePath = path.join(
      process.cwd(),
      'src/templates',
      `${templateName}.html`
    );

    const content = await fs.readFile(filePath, 'utf-8');

    let processedContent = content;
    for (const key in data) {
      const pattern = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      processedContent = processedContent.replace(pattern, data[key]);
    }

    return {
      ok: true,
      data: { content: processedContent },
    };
  } catch (e: unknown) {
    const error = e as Error;
    return {
      ok: false,
      error: {
        message: `Failed to load or process email template: ${templateName}`,
        origin: 'utilities',
        method: 'loadEmailTemplate',
        raw: { name: error.name, message: error.message },
      },
    };
  }
}
