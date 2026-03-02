declare global {
  namespace API {
    interface Success<D = Record<unknown>, M = Record<unknown>> {
      ok: true;
      data?: D;
      meta?: M;
    }

    interface Failure {
      ok: false;
      error: {
        message: string;
        origin: 'policies' | 'handlers' | 'routes' | 'utilities';
        method: string;
        field?: string | null;
        raw?: {
          name?: string;
          message?: string;
        };
      };
    }
  }
}

declare module 'react-syntax-highlighter';
declare module 'react-syntax-highlighter/dist/esm/styles/prism';

export {};
