export default {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Lexend', 'system-ui', 'sans-serif'], 
      },
      colors: {
        text: {
          primary: '#4F5962',
          secondary: '#91989E',
          info: '#91989E',
          darkprimary: '#ffffff',
          darksecondary: '#A1A8B0',
          darkinfo: '#CBD4DC',
        },
        background: {
          light: '#FAECE5',
          dark: '#212732',
          card: '#FFFFFF',
          darkcard: '#4F5962',
          darkinsetcard: '#2D3545',
          insetcard: '#F6DFD3',
        },
        accent: {
          primary: '#4C6CA8',
          primaryhover: '#3A5D91',
          success: '#4BAF8E',
          successhover: '#3B8F75',
          destructive: '#D66565',
          destructivehover: '#B94E4E',
          focusring: '#90A9D6',
          successfocusring: '#94dac1ff',
          gold: '#F59E0B',
          goldhover: '#ce890aff',
          focusgold: '#FCD34D',
        },  
      },
    },
  },
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  plugins: [],
};
