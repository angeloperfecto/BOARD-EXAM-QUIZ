import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Convert Word Document to HTML using mammoth
    // Mammoth automatically converts embedded images into base64 <img> tags
    const result = await mammoth.convertToHtml({ buffer });
    const html = result.value;
    const warnings = result.messages;

    return NextResponse.json({
      success: true,
      html,
      warnings,
      fileName: file.name,
      fileSize: file.size,
    });
  } catch (error: any) {
    console.error('Error parsing DOCX:', error);
    return NextResponse.json(
      { error: 'Failed to parse Microsoft Word file: ' + (error.message || error) },
      { status: 500 }
    );
  }
}
