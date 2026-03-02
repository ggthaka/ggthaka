import localFont from 'next/font/local';

export const gantari = localFont({
  src: [
    {
      path: '../../fonts/variable/gantari/regular.ttf',
      style: 'normal',
      weight: '100 900',
    },
    {
      path: '../../fonts/variable/gantari/italic.ttf',
      style: 'italic',
      weight: '100 900',
    },
  ],
});
