import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class MajorsService {
  constructor(private readonly supabase: SupabaseService) { }

  async create(data: {
    name: string;
    name_th?: string;
    description?: string;
    faculty_id: number;
  }) {
    const { data: rpcData, error: idError } =
      await this.supabase.client.rpc('get_next_major_id');

    if (idError) throw new BadRequestException(idError.message);

    const nextMajorId =
      Array.isArray(rpcData)
        ? rpcData[0]?.next_id
        : rpcData?.next_id;

    if (!nextMajorId) {
      throw new BadRequestException('Cannot generate major_id');
    }

    const { data: result, error } = await this.supabase.client
      .schema('admin')
      .from('majors')
      .insert({
        major_id: nextMajorId,
        ...data,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return result;
  }

  async findAll() {
    const { data, error } = await this.supabase.client
      .schema('admin')
      .from('majors')
      .select('*')
      .order('major_id');

    if (error) throw new NotFoundException(error.message);
    return data;
  }

  async update(
    id: number,
    data: Partial<{
      name: string;
      name_th?: string;
      description?: string;
      faculty_id?: number;
    }>
  ) {
    console.log('UPDATE MAJOR:', { id, data });

    const { data: result, error } = await this.supabase.client
      .schema('admin')
      .from('majors')
      .update(data)
      .eq('major_id', id)
      .select()
      .single();

    if (error) {
      console.error('SUPABASE UPDATE ERROR:', error);
      throw new NotFoundException(error.message);
    }

    return result;
  }

  async remove(id: number) {
    console.log('DELETE MAJOR ID:', id);

    const { error } = await this.supabase.client
      .schema('admin')
      .from('majors')
      .delete()
      .eq('major_id', id);

    if (error) {
      console.error('SUPABASE DELETE ERROR:', error);
      throw new NotFoundException(error.message);
    }

    return { success: true };
  }
}
