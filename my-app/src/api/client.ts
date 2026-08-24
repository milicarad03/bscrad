let onUnauthorized: (() => void) | null = null;

export const setUnauthorizedHandler = (handler: () => void) => {
  onUnauthorized = handler;
};


export const apiClient = async <T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
  body?: any,
  token?: string | null,
  params?: Record<string, any>,
  signal?: AbortSignal
  
): Promise<T> => {

  let url = endpoint;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
            value.forEach(v => {
              searchParams.append(key, v.toString());
            });
          } else {
          
            searchParams.append(key, value.toString());
          }
        }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const isFormData =
    typeof FormData !== 'undefined' &&
    body instanceof FormData;

  const headers: HeadersInit = {};

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    const requestBody =
      body !== undefined && body !== null
        ? isFormData
          ? body
          : JSON.stringify(body)
        : undefined;

    response = await fetch(url, {
      method,
      headers,
      body: requestBody,
      signal,
    });
  } catch (err: any) {
    // ISPRAVKA: AbortError se ne tretira kao mrezna greska - to je
    // namerno otkazivanje (npr. unmount), pa ga samo prosledjujemo dalje
    // bez toast poruke; pozivalac (useCallback cleanup) ce ga ignorisati.
    if (err?.name === 'AbortError') {
      throw err;
    }
    throw new Error('NetworkError');
  }


  /*if (response.status === 401) {
   
    if (onUnauthorized) {
      onUnauthorized();
    }
    return Promise.reject(new Error('Unauthorized'));
  }*/
  if (response.status === 401) {
  const errorData = await response.json().catch(() => ({}));

  if (endpoint.includes('/users/login')) {
    return Promise.reject(new Error(errorData.message || 'Invalid credentials'));
  }

  if (onUnauthorized) onUnauthorized();
  return Promise.reject(new Error(errorData.message || 'Unauthorized'));
}


 if (!response.ok) {
  const errorData = await response.json().catch(() => ({}));

  console.log('STATUS:', response.status);
  console.log('ERROR DATA:', errorData);

  const message =
    Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : errorData.message;

  const details =
    Array.isArray(errorData.errors)
      ? errorData.errors.join(' | ')
      : null;

  throw new Error(
    details ||
    message ||
    'Error on server',
  );
}
  const text = await response.text();
  if (!text) {
    return null as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return null as T;
  }
 // return response.json();
};