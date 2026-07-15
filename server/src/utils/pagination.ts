export function formatSuccess<T>(data: T, message = "OK") {
  return { success: true, message, data };
}

export function formatError(message: string, code = "ERROR") {
  return { success: false, message, code };
}
