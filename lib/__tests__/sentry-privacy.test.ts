import { privacyBeforeSend, privacyBeforeBreadcrumb } from '../sentry-privacy';
import * as Sentry from '@sentry/react-native';

describe('privacyBeforeSend', () => {
  it('should strip message content from request data', () => {
    const event: Sentry.Event = {
      request: {
        data: {
          message: 'Sensitive recovery message',
          content: 'Task description',
          user_id: '123',
        },
      },
    };

    const scrubbed = privacyBeforeSend(event);

    expect(scrubbed?.request?.data?.message).toBe('[Filtered]');
    expect(scrubbed?.request?.data?.content).toBe('[Filtered]');
    expect(scrubbed?.request?.data?.user_id).toBe('123');
  });

  it('should redact email addresses from error messages', () => {
    const event: Sentry.Event = {
      message: 'Error for user test@example.com',
    };

    const scrubbed = privacyBeforeSend(event);

    expect(scrubbed?.message).toBe('Error for user [email]');
  });

  it('should preserve user ID but remove personal info', () => {
    const event: Sentry.Event = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        ip_address: '192.168.1.1',
      },
    };

    const scrubbed = privacyBeforeSend(event);

    expect(scrubbed?.user?.id).toBe('user-123');
    expect(scrubbed?.user?.email).toBeUndefined();
    expect(scrubbed?.user?.username).toBeUndefined();
    expect(scrubbed?.user?.ip_address).toBeUndefined();
  });

  it('should sanitize exception values', () => {
    const event: Sentry.Event = {
      exception: {
        values: [
          {
            type: 'Error',
            value: 'Failed to save message: "Help me stay sober"',
          },
        ],
      },
    };

    const scrubbed = privacyBeforeSend(event);

    expect(scrubbed?.exception?.values?.[0].value).not.toContain('Help me');
  });
});

describe('privacyBeforeBreadcrumb', () => {
  it('should filter Supabase query breadcrumbs', () => {
    const breadcrumb: Sentry.Breadcrumb = {
      category: 'http',
      data: {
        url: 'https://project.supabase.co/rest/v1/messages?select=*',
        method: 'GET',
        status_code: 200,
      },
    };

    const filtered = privacyBeforeBreadcrumb(breadcrumb);

    expect(filtered?.data?.table).toBe('messages');
    expect(filtered?.data?.method).toBe('GET');
    expect(filtered?.data?.status_code).toBe(200);
    expect(filtered?.data?.url).toBeUndefined();
  });

  it('should remove route params from navigation breadcrumbs', () => {
    const breadcrumb: Sentry.Breadcrumb = {
      category: 'navigation',
      data: {
        from: '/(tabs)/index',
        to: '/(tabs)/messages?user_id=123&message_id=456',
      },
    };

    const filtered = privacyBeforeBreadcrumb(breadcrumb);

    expect(filtered?.data?.to).toBe('/(tabs)/messages');
    expect(filtered?.data?.from).toBe('/(tabs)/index');
  });
});

describe('Edge Cases', () => {
  it('should handle deeply nested sensitive data', () => {
    const event: Sentry.Event = {
      request: {
        data: {
          level1: {
            level2: {
              level3: {
                level4: {
                  level5: {
                    message: 'Deeply nested sensitive message',
                    email: 'test@example.com',
                  },
                },
              },
            },
          },
        },
      },
    };

    const scrubbed = privacyBeforeSend(event);

    expect(scrubbed?.request?.data?.level1?.level2?.level3?.level4?.level5?.message).toBe(
      '[Filtered]'
    );
    expect(scrubbed?.request?.data?.level1?.level2?.level3?.level4?.level5?.email).toBe(
      '[Filtered]'
    );
  });

  it('should handle circular references safely', () => {
    const circularObj: any = { name: 'test', user_id: '123' };
    circularObj.self = circularObj;

    const event: Sentry.Event = {
      request: {
        data: circularObj,
      },
    };

    // Should not throw or hang
    expect(() => privacyBeforeSend(event)).not.toThrow();
  });

  it('should preserve non-sensitive data', () => {
    const event: Sentry.Event = {
      request: {
        data: {
          user_id: '123',
          step_number: 5,
          is_completed: true,
          created_at: '2025-11-13T00:00:00Z',
        },
      },
    };

    const scrubbed = privacyBeforeSend(event);

    expect(scrubbed?.request?.data?.user_id).toBe('123');
    expect(scrubbed?.request?.data?.step_number).toBe(5);
    expect(scrubbed?.request?.data?.is_completed).toBe(true);
    expect(scrubbed?.request?.data?.created_at).toBe('2025-11-13T00:00:00Z');
  });

  it('should handle null and undefined values', () => {
    const event: Sentry.Event = {
      request: {
        data: {
          message: null,
          content: undefined,
          user_id: '123',
          nested: {
            email: null,
            phone: undefined,
          },
        },
      },
    };

    const scrubbed = privacyBeforeSend(event);

    // Should not crash, and null/undefined should be preserved for non-sensitive fields
    expect(scrubbed?.request?.data?.user_id).toBe('123');
    expect(scrubbed?.request?.data?.message).toBe('[Filtered]');
  });

  it('should handle very large strings', () => {
    // Generate a 50KB string
    const largeString = 'a'.repeat(50000);
    const event: Sentry.Event = {
      message: `Error: ${largeString} with email test@example.com`,
    };

    // Should complete without hanging and still scrub emails correctly
    const scrubbed = privacyBeforeSend(event);

    // Verify email scrubbing works even with large strings
    expect(scrubbed?.message).toContain('[email]');
    expect(scrubbed?.message).not.toContain('test@example.com');
  });

  it('should scrub multiple email addresses in one string', () => {
    const event: Sentry.Event = {
      message: 'Error for users test@example.com, admin@test.org, and user123@domain.co.uk',
    };

    const scrubbed = privacyBeforeSend(event);

    expect(scrubbed?.message).toBe('Error for users [email], [email], and [email]');
    expect(scrubbed?.message).not.toContain('@');
  });

  it('should handle breadcrumb filtering edge cases', () => {
    // Null breadcrumb data
    const nullDataBreadcrumb: Sentry.Breadcrumb = {
      category: 'navigation',
      data: null as any,
    };

    expect(() => privacyBeforeBreadcrumb(nullDataBreadcrumb)).not.toThrow();

    // Undefined URL in http breadcrumb
    const undefinedUrlBreadcrumb: Sentry.Breadcrumb = {
      category: 'http',
      data: {
        method: 'GET',
        url: undefined as any,
      },
    };

    expect(() => privacyBeforeBreadcrumb(undefinedUrlBreadcrumb)).not.toThrow();

    // Empty string in navigation
    const emptyNavBreadcrumb: Sentry.Breadcrumb = {
      category: 'navigation',
      data: {
        from: '',
        to: '',
      },
    };

    const filtered = privacyBeforeBreadcrumb(emptyNavBreadcrumb);
    expect(filtered?.data?.from).toBe('');
    expect(filtered?.data?.to).toBe('');
  });
});
