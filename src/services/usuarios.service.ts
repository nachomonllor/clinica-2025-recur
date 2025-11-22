import { Injectable } from "@angular/core";
import { SupabaseService } from "./supabase.service";
import { Usuario, UsuarioCreate, UsuarioUpdate } from "../app/models/usuario.model";
import { Rol } from "../app/models/tipos.model";


@Injectable({ providedIn: 'root' })
export class UsuariosService {

  constructor(
    private readonly supa: SupabaseService,
  ) { }

  /**
   * Devuelve el usuario de esquema_clinica.usuarios
   * correspondiente al user autenticado en Supabase Auth.
   * Si no hay sesión, devuelve null.
   */
  async obtenerUsuarioActual(): Promise<Usuario | null> {
    const { data, error } = await this.supa.getSession();
    if (error) {
      console.error('[UsuariosService] Error al obtener sesión', error);
      throw error;
    }

    const session = data.session;
    if (!session?.user) {
      return null;
    }

    const { data: usuario, error: eUsuario } =
      await this.supa.obtenerUsuarioPorId(session.user.id);

    if (eUsuario) {
      console.error('[UsuariosService] Error al obtener usuario actual', eUsuario);
      throw eUsuario;
    }

    return usuario;
  }

  /**
   * Obtiene un usuario por id (tabla usuarios).
   */
  async obtenerPorId(id: string): Promise<Usuario | null> {
    const { data, error } = await this.supa.obtenerUsuarioPorId(id);
    if (error) {
      console.error('[UsuariosService] Error al obtener usuario por id', error);
      throw error;
    }
    return data;
  }

  /**
   * Listado de usuarios con filtros opcionales para administrador.
   *
   * - perfil: filtra por rol (PACIENTE / ESPECIALISTA / ADMIN)
   * - soloActivos: si true, trae solo activo = true
   * - texto: busca por nombre, apellido, email o dni (ilike)
   * - limite: limita la cantidad de filas
   */
  async listarUsuarios(opciones?: {
    perfil?: Rol;
    soloActivos?: boolean;
    texto?: string;
    limite?: number;
  }): Promise<Usuario[]> {

    let query = this.supa.client
      .from('usuarios')
      .select('*')
      .order('apellido', { ascending: true })
      .order('nombre', { ascending: true });

    if (opciones?.perfil) {
      query = query.eq('perfil', opciones.perfil);
    }

    if (opciones?.soloActivos) {
      query = query.eq('activo', true);
    }

    if (opciones?.texto && opciones.texto.trim() !== '') {
      const t = opciones.texto.trim();
      const pattern = `%${t}%`;
      // or() usa la sintaxis: campo.operador.valor
      query = query.or(
        [
          `nombre.ilike.${pattern}`,
          `apellido.ilike.${pattern}`,
          `email.ilike.${pattern}`,
          `dni.ilike.${pattern}`,
        ].join(',')
      );
    }

    if (opciones?.limite && opciones.limite > 0) {
      query = query.limit(opciones.limite);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[UsuariosService] Error al listar usuarios', error);
      throw error;
    }

    return (data ?? []) as Usuario[];
  }

  /**
   * Crea un nuevo usuario en la tabla usuarios.
   * OJO: el campo password es NOT NULL según tu esquema.
   * Deberías guardar un hash o algún marcador, nunca texto plano.
   */
  async crearUsuario(payload: UsuarioCreate): Promise<Usuario> {
    const { data, error } = await this.supa.client
      .from('usuarios')
      .insert(payload)
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('[UsuariosService] Error al crear usuario', error);
      throw error;
    }

    return data as Usuario;
  }

  /**
   * Actualiza campos de un usuario existente.
   * Recibe solo los cambios (patch).
   */
  async actualizarUsuario(id: string, cambios: UsuarioUpdate): Promise<Usuario> {
    const { data, error } = await this.supa.client
      .from('usuarios')
      .update(cambios)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('[UsuariosService] Error al actualizar usuario', error);
      throw error;
    }

    return data as Usuario;
  }

  /**
   * Marca un especialista como aprobado / no aprobado.
   * (esta_aprobado = true/false)
   */
  async setAprobado(id: string, aprobado: boolean): Promise<Usuario> {
    return this.actualizarUsuario(id, { esta_aprobado: aprobado });
  }

  /**
   * Habilita / deshabilita un usuario (activo = true/false).
   */
  async setActivo(id: string, activo: boolean): Promise<Usuario> {
    return this.actualizarUsuario(id, { activo });
  }

  /**
   * Actualiza una de las imágenes de perfil usando el bucket 'avatars'.
   * idx = 1 → imagen_perfil_1
   * idx = 2 → imagen_perfil_2
   */
  async actualizarAvatar(id: string, file: File, idx: 1 | 2): Promise<Usuario> {
    // Subimos archivo y obtenemos URL pública
    const url = await this.supa.uploadAvatar(id, file, idx);

    const cambios: UsuarioUpdate =
      idx === 1
        ? { imagen_perfil_1: url }
        : { imagen_perfil_2: url };

    return this.actualizarUsuario(id, cambios);
  }

  /**
   * (Opcional) Elimina un usuario físicamente.
   * En la mayoría de los TPs alcanza con marcar activo = false.
   */
  async eliminarUsuario(id: string): Promise<void> {
    const { error } = await this.supa.client
      .from('usuarios')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[UsuariosService] Error al eliminar usuario', error);
      throw error;
    }
  }
}

