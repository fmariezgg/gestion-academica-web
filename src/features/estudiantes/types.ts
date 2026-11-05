/** Shape returned by GET/POST /estudiantes. */
export interface EstudianteResponse {
  id: number
  nombre: string
  correo: string
  edad: number
  carreraId: number
}

/** Body of POST /estudiantes. Note: the request field is `carrera` (an id), the response field is `carreraId`. */
export interface EstudianteRequest {
  nombre: string
  correo: string
  edad: number
  carrera: number
}
