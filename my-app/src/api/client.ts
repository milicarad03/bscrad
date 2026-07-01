let onUnauthorized: (() => void) | null = null;

export const setUnauthorizedHandler = (handler: () => void) => {
  onUnauthorized = handler;
};


export const apiClient = async <T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
  body?: any,
  token?: string | null,
  params?: Record<string, any>
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

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }


  const response = await fetch(url, { 
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

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
    throw new Error(errorData.message || 'Došlo je do greške na serveru');
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