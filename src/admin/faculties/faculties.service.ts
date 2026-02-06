import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class FacultiesService {
  constructor(
    private readonly supabaseService: SupabaseService,
  ) { }

  async createFaculty(data: {
    name: string;
    name_th?: string;
    icon?: string;
    theme_color?: string;
  }) {
    const { data: rpcData, error: idError } =
      await this.supabaseService.client.rpc('get_next_faculty_id');

    if (idError) throw new BadRequestException(idError.message);

    const nextFacultyId =
      Array.isArray(rpcData)
        ? rpcData[0]?.next_id
        : rpcData?.next_id;

    if (!nextFacultyId) {
      throw new BadRequestException('Cannot generate faculty_id');
    }

    const { data: result, error } =
      await this.supabaseService.client
        .schema('admin')
        .from('faculties')
        .insert({
          faculty_id: nextFacultyId,
          ...data,
        })
        .select()
        .single();

    if (error) throw new BadRequestException(error.message);
    return result;
  }

  async getFaculties() {
    const { data, error } =
      await this.supabaseService.client
        .schema('admin')
        .from('faculties')
        .select('*')
        .order('faculty_id', { ascending: true });

    if (error) throw new NotFoundException(error.message);
    return data;
  }

  async getFacultyById(facultyId: number) {
    const { data, error } =
      await this.supabaseService.client
        .schema('admin')
        .from('faculties')
        .select('*')
        .eq('faculty_id', facultyId)
        .single();

    if (error || !data) {
      throw new NotFoundException('Faculty not found');
    }

    return data;
  }

  async updateFaculty(
    facultyId: number,
    data: {
      name?: string;
      name_th?: string;
      icon?: string;
      theme_color?: string;
    },
  ) {
    const { data: result, error } =
      await this.supabaseService.client
        .schema('admin')
        .from('faculties')
        .update(data)
        .eq('faculty_id', facultyId)
        .select()
        .single();

    if (error || !result) {
      throw new NotFoundException(
        error?.message || 'Faculty not found',
      );
    }

    return result;
  }

  async deleteFaculty(facultyId: number) {
    const { error } =
      await this.supabaseService.client
        .schema('admin')
        .from('faculties')
        .delete()
        .eq('faculty_id', facultyId);

    if (error) throw new NotFoundException(error.message);
    return { success: true };
  }
}
