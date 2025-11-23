// Test environment variables
console.log('=== ENV TEST ===');
console.log('POE:', import.meta.env.VITE_POE_API_KEY ? 'EXISTS' : 'MISSING');
console.log('TOGETHER:', import.meta.env.VITE_TOGETHER_API_KEY ? 'EXISTS' : 'MISSING');
console.log('GROQ:', import.meta.env.VITE_GROQ_API_KEY ? 'EXISTS' : 'MISSING');
console.log('GROQ VALUE:', import.meta.env.VITE_GROQ_API_KEY?.substring(0, 10) + '...');
