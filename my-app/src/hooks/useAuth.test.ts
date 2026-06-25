import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from './useAuth';
import { apiClient } from '../api/client';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../api/client', () => ({
  apiClient: vi.fn(),
}));

describe('useAuth Hook', () => {
    let store: Record<string, string> = {};
 
    beforeEach(() => {
    vi.clearAllMocks();
    store = {};
    vi.stubGlobal('sessionStorage', {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value.toString();
      }),
      clear: vi.fn(() => {
        store = {};
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      })
    });
  });

 

  it('should set logged in state after successful login', async () => {
    const mockResponse = { user: { email: 'test@test.com' }, accessToken: 'fake-token' };
    (apiClient as any).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.setEmail('test@test.com');
      result.current.setPassword('password123');
    });

    await act(async () => {
      await result.current.handleLogin({ preventDefault: () => {} } as any);
    });

    expect(result.current.isLoggedIn).toBe(true);
    expect(result.current.token).toBe('fake-token');
  });

  it('should handle login error gracefully', async () => {
    (apiClient as any).mockRejectedValue(new Error('Invalid credentials'));

    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.setEmail('test@test.com');
      result.current.setPassword('wrong');
    });

    await act(async () => {
      await result.current.handleLogin({ preventDefault: () => {} } as any);
    });

    expect(result.current.message).toBe('Invalid credentials');
    expect(result.current.isLoggedIn).toBe(false);
  });

  it('should logout and clear state', () => {
    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.handleLogout();
    });

    expect(result.current.isLoggedIn).toBe(false);
    expect(result.current.token).toBeNull();
  });

  
  it('should logout automatically when 401 error occurs during fetchUsers', async () => {
    (apiClient as any).mockRejectedValue(new Error('401 Unauthorized'));
    
  
    sessionStorage.setItem('token', 'expired-token');

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.fetchUsers();
    });

    
    expect(result.current.isLoggedIn).toBe(false);
    expect(result.current.token).toBeFalsy();
  });

 
  it('should set success message on successful registration', async () => {
    const mockUser = { name: 'New User', email: 'new@test.com' };
    (apiClient as any).mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.handleRegister({ preventDefault: () => {} } as any);
    });

    expect(result.current.regMessage).toContain('Registration successful');
  });

  it('should toggle loading state during login', async () => {
    const pendingPromise = new Promise(() => {});
    (apiClient as any).mockReturnValue(pendingPromise);

    const { result } = renderHook(() => useAuth());

    act(() => {
        result.current.setEmail('a@a.com');
        result.current.setPassword('1');
    });

    act(() => {
        result.current.handleLogin({ preventDefault: () => {} } as any);
    });

    await act(async () => {}); 

    expect(result.current.loading).toBe(true);
    });


    it('should logout on 401 error during fetchProfile', async () => {
    ;(apiClient as any).mockRejectedValue(new Error('401 Unauthorized'))

    sessionStorage.setItem('token', 'expired')

    const { result } = renderHook(() => useAuth())

    await act(async () => {
        await result.current.fetchProfile()
    })

    expect(result.current.isLoggedIn).toBe(false)
    });


   it('should not update user status if approval fails', async () => {
    const users = [{ id: 1, status: 'PENDING' }];
    sessionStorage.setItem('token', 'valid');

    
    (apiClient as any)
        .mockResolvedValueOnce(users)
        .mockRejectedValueOnce(new Error('fail')); 
  

   console.log('Token iz storagea:', sessionStorage.getItem('token'))
    const { result } = renderHook(() => useAuth());

  
    await act(async () => {
        await result.current.fetchUsers();
    });

    expect(result.current.users.length).toBe(1);


    await act(async () => {
        result.current.handleApproveUser(1, 'APPROVED');
    });

    expect(result.current.users[0].status).toBe('PENDING');
});

it('should remove user from state after successful deletion', async () => {
    const users = [
        { id: 1, name: 'User1' },
        { id: 2, name: 'User2' }
    ];
    sessionStorage.setItem('token', 'valid');
   

    (apiClient as any)
        .mockResolvedValueOnce(users)   
        .mockResolvedValueOnce({});     


    const { result } = renderHook(() => useAuth());


    await act(async () => {
        await result.current.fetchUsers();
    });


    expect(result.current.users.length).toBe(2);

    await act(async () => {
        result.current.handleDeleteUser(1);
    });

    expect(result.current.users.find(u => u.id === 1)).toBeUndefined();
    });

});