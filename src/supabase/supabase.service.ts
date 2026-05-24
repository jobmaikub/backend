// src/supabase/supabase.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class SupabaseService {
  public client: SupabaseClient;

  constructor(private configService: ConfigService) {
    const url = this.configService.get<string>('SUPABASE_URL');
    const key = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!url || !key) {
      throw new Error('Supabase env variables are missing');
    }

    this.client = createClient(url, key);
  }

  async generateExplanationsBatch(user: any, careers: any[]) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      console.error('Gemini API Error: Missing API Key');
      return {};
    }

    const careersInfo = careers
      .map(
        (c) =>
          `- ID: ${c.career_id}, Title: ${c.title}, Match: ${c.match_score}%, Has Skills: ${(c.matching_skills || []).join(', ') || 'None'}, Missing Skills: ${(c.skills_to_develop || []).join(', ') || 'None'}`,
      )
      .join('\n');

    const prompt = `
Profile:
Faculty:${user.faculty}
Major:${user.major}
Skills:${(user.skills_detail || []).map((s: any) => s.name).join(',')}
Interests:${(user.interests_detail || []).join(',')}

Careers:
${careersInfo}

Task: Return a JSON object mapped by Career ID. For each career, provide ONLY a 3-4 sentence formal English explanation stating why they match and what they lack. Do not list the skills as arrays, just incorporate them naturally into the paragraph.

Example format:
{
  "7": {
    "explanation": "Matches well due to data analysis skills, but requires learning ad platforms."
  }
}
`;

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      // Using Flash Lite tier as it is the most cost-effective option
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash-lite',
      });

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          maxOutputTokens: 1000,
        },
      });

      const text = result.response.text();
      return JSON.parse(text);
    } catch (e) {
      console.error('Gemini SDK Error:', e);
      return {};
    }
  }
}
