import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AiService {
  constructor(private readonly supabase: SupabaseService) {}

  async getFaculties(searchText: string = '') {
    const { data, error } = await this.supabase.client.rpc('search_faculties', {
      search_text: searchText,
    });
    if (error) throw error;
    return data;
  }

  async getMajors(facultyId: number) {
    const { data, error } = await this.supabase.client.rpc(
      'get_majors_by_faculty',
      { fac_id: facultyId },
    );
    if (error) throw error;
    return data;
  }

  async getSkills(searchText: string = '') {
    const { data, error } = await this.supabase.client.rpc('search_skills', {
      search_text: searchText,
    });
    if (error) throw error;
    return data;
  }

  async getInterests(searchText: string = '') {
    const { data, error } = await this.supabase.client.rpc('search_interests', {
      search_text: searchText,
    });
    if (error) throw error;
    return data;
  }

  async getCareerById(careerId: number) {
    const { data, error } = await this.supabase.client
      .schema('admin')
      .from('careers')
      .select('*, industries(name)')
      .eq('career_id', careerId)
      .single();

    if (error) throw error;

    // Format the response slightly to make it easier for the frontend
    return {
      ...data,
      industry: data.industries?.[0]?.name || null,
      industries: undefined,
    };
  }

  async getCareerMatch(user) {
    // 1. เรียก SQL
    const { data, error } = await this.supabase.client.rpc('ai_match_careers', {
      user_faculty: user.faculty_id,
      user_major: user.major_id,
      user_skills: user.skills,
      user_interests: user.interests,
    });

    if (error) throw error;

    // 2. Fetch specific names from database
    const { data: faculty } = await this.supabase.client
      .schema('admin')
      .from('faculties')
      .select('eng_name, th_name')
      .eq('faculty_id', user.faculty_id)
      .single();

    const { data: major } = await this.supabase.client
      .schema('admin')
      .from('majors')
      .select('eng_name, th_name')
      .eq('major_id', user.major_id)
      .single();

    const { data: skills } = await this.supabase.client
      .schema('admin')
      .from('skills')
      .select('name')
      .in('skill_id', user.skills || []);

    const { data: interests } = await this.supabase.client
      .schema('admin')
      .from('interests')
      .select('interest_name')
      .in('interest_id', user.interests || []);

    const enrichedUser = {
      faculty: faculty?.eng_name || faculty?.th_name || 'Unknown',
      major: major?.eng_name || major?.th_name || 'Unknown',
      skills_detail: skills || [],
      interests_detail: (interests || []).map((i) => i.interest_name),
    };

    // 2.5. Fetch required skills for the top 5 careers from DB to prevent AI hallucination
    if (data && data.length > 0) {
      const careerIds = data
        .map((c) => c.career_id || c.id)
        .filter((id) => id != null);

      let careerSkillsMap: any[] = [];
      let careersFromDb: any[] = [];

      if (careerIds.length > 0) {
        // Fetch from mapping table
        const { data: csm } = await this.supabase.client
          .schema('admin')
          .from('career_skills')
          .select('career_id, skill_id')
          .in('career_id', careerIds);
        if (csm) careerSkillsMap = csm;

        // Also fetch from careers table to get required_skills, image_url, and industry name
        const { data: cdb } = await this.supabase.client
          .schema('admin')
          .from('careers')
          .select('career_id, required_skills, image_url, industries(name)')
          .in('career_id', careerIds);
        if (cdb) careersFromDb = cdb;
      }

      let allRequiredSkillIds: number[] = [];
      allRequiredSkillIds.push(...careerSkillsMap.map((cs) => cs.skill_id));

      // Process required_skills from both RPC data and careers table
      const processRequiredSkills = (rs: any) => {
        if (rs && Array.isArray(rs)) {
          rs.forEach((item) => {
            if (typeof item === 'number') allRequiredSkillIds.push(item);
          });
        }
      };

      for (const c of data) {
        processRequiredSkills(c.required_skills);
      }
      for (const c of careersFromDb) {
        processRequiredSkills(c.required_skills);
      }

      allRequiredSkillIds = [...new Set(allRequiredSkillIds)];

      let requiredSkillsDict: any[] = [];
      if (allRequiredSkillIds.length > 0) {
        const { data: rsd } = await this.supabase.client
          .schema('admin')
          .from('skills')
          .select('skill_id, name')
          .in('skill_id', allRequiredSkillIds);
        if (rsd) requiredSkillsDict = rsd;
      }

      const userSkillNames = Array.isArray(skills)
        ? skills.map((s) => s.name)
        : [];

      for (const career of data) {
        const cId = career.career_id || career.id;
        const cSkillIds = careerSkillsMap
          .filter((cs) => cs.career_id === cId)
          .map((cs) => cs.skill_id);

        let cSkillNames: string[] = [];
        cSkillNames.push(
          ...requiredSkillsDict
            .filter((s) => cSkillIds.includes(s.skill_id))
            .map((s) => s.name),
        );

        const dbCareer = careersFromDb.find((c) => c.career_id === cId);

        // Ensure image_url and industry are passed to the frontend
        if (dbCareer) {
          career.image_url = dbCareer.image_url;
          career.industry = dbCareer.industries?.[0]?.name || null;
        }

        const combinedRequired = [
          ...(Array.isArray(career.required_skills)
            ? career.required_skills
            : []),
          ...(dbCareer && Array.isArray(dbCareer.required_skills)
            ? dbCareer.required_skills
            : []),
        ];

        if (combinedRequired.length > 0) {
          combinedRequired.forEach((rs) => {
            if (typeof rs === 'string') {
              cSkillNames.push(rs);
            } else if (typeof rs === 'number') {
              const found = requiredSkillsDict.find((s) => s.skill_id === rs);
              if (found) cSkillNames.push(found.name);
            }
          });
        }

        cSkillNames = [...new Set(cSkillNames)];

        career.db_required_skills = cSkillNames;
        career.matching_skills = userSkillNames.filter((s) =>
          cSkillNames.includes(s),
        );
        career.skills_to_develop = cSkillNames.filter(
          (s) => !userSkillNames.includes(s),
        );
      }
    }

    // 3. เรียก Gemini แบบ Batch (รวบยอดครั้งเดียวลดค่าใช้จ่าย)
    const results: any[] = [];
    if (data && data.length > 0) {
      const explanationsMap = await this.supabase.generateExplanationsBatch(
        enrichedUser,
        data,
      );

      for (const career of data) {
        // AI now just returns an explanation string or simple object
        const aiId = career.career_id || career.id;
        const aiInfo = explanationsMap[aiId];

        let explanationText = 'No explanation available.';
        if (aiInfo) {
          if (typeof aiInfo === 'string') {
            explanationText = aiInfo;
          } else {
            explanationText = aiInfo.explanation || 'No explanation available.';
          }
        }

        results.push({
          ...career,
          explanation: explanationText,
          // matching_skills and skills_to_develop are already in the 'career' object
        });
      }
    }

    // 4. บันทึกลงประวัติ (ถ้ามี user_id)
    if (user.user_id && results.length > 0) {
      const top5 = [...results]
        .sort(
          (a, b) =>
            Number(b.match_score ?? b.score ?? 0) -
            Number(a.match_score ?? a.score ?? 0),
        )
        .slice(0, 5);

      // ลบ history เก่าของ user นี้ก่อน (ป้องกัน duplicate และ sequence desync)
      await this.supabase.client
        .from('user_ai_results')
        .delete()
        .eq('user_id', user.user_id);

      // Insert ผลลัพธ์ใหม่ พร้อม selection ที่ user เลือก
      const inserts = top5.map((res) => ({
        user_id: user.user_id,
        career_id: res.career_id || res.id,
        score: Number(res.match_score ?? res.score ?? 0),
        explanation: res.explanation,
        matching_skills: res.matching_skills || [],
        skills_to_develop: res.skills_to_develop || [],
        faculty_id: user.faculty_id || null,
        major_id: user.major_id || null,
        skill_ids: user.skills || [],
        interest_ids: user.interests || [],
      }));

      const { error: insertError } = await this.supabase.client
        .from('user_ai_results')
        .insert(inserts);

      if (insertError) {
        console.error('Failed to insert AI results:', insertError);
        throw insertError;
      }
    }

    return results;
  }

  async getLatestMatches(userId: string) {
    const { data: matches, error } = await this.supabase.client
      .from('user_ai_results')
      .select(
        'id, career_id, score, explanation, matching_skills, skills_to_develop, faculty_id, major_id, skill_ids, interest_ids',
      )
      .eq('user_id', userId)
      .order('id', { ascending: false })
      .limit(5);

    if (error || !matches || matches.length === 0) return [];

    const careerIds = matches.map((m) => m.career_id);
    const { data: dbDetails } = await this.supabase.client
      .schema('admin')
      .from('careers')
      .select('career_id, title, description, image_url, industries(name)')
      .in('career_id', careerIds);

    // ดึง selection ที่ user เลือกจาก row แรก (ทุก row ใช้ selection เดียวกัน)
    const firstMatch = matches[0];
    const userSelection = {
      faculty_id: firstMatch?.faculty_id ?? null,
      major_id: firstMatch?.major_id ?? null,
      skill_ids: firstMatch?.skill_ids ?? [],
      interest_ids: firstMatch?.interest_ids ?? [],
    };

    const mapped = matches.map((m) => {
      const db = dbDetails?.find((d) => d.career_id === m.career_id);
      return {
        career_id: m.career_id,
        title: db?.title || 'Unknown',
        explanation: m.explanation,
        description: db?.description,
        matching_skills: m.matching_skills || [],
        skills_to_develop: m.skills_to_develop || [],
        match_score: m.score,
        score: m.score,
        image_url: db?.image_url,
        industry: db?.industries?.[0]?.name || null,
      };
    });

    const sorted = mapped.sort(
      (a, b) =>
        Number(b.match_score ?? b.score ?? 0) -
        Number(a.match_score ?? a.score ?? 0),
    );

    // Return พร้อม selection ที่ user เคยเลือก
    return { matches: sorted, userSelection };
  }
}
