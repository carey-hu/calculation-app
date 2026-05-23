/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Text',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      colors: {
        ink: '#2E3940',
        muted: '#5C6970',
        hint: '#8A969C',
        canvas: '#EBEFF2',
        surface: '#FFFFFF',
        control: '#F4F7F8',
        pressed: '#E3E9EC',
        line: '#DCE3E7',
        lineStrong: '#B9CBD4',
        accent: '#4F86A3',
        accentDeep: '#3D7088',
        accentSoft: '#E8EFF2',
        successBg: '#E4EEE6',
        successText: '#3F6B4A',
        warnBg: '#F6E9DD',
        warnText: '#8A6233',
        errorBg: '#F3E2E2',
        errorText: '#8F4444',
      },
      boxShadow: {
        soft: 'none',
        lift: 'none',
      },
    },
  },
  plugins: [],
}
