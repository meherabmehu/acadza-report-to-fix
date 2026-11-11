// Only fixed, trusted provider endpoints are supported; keys never go to the browser.
export function providerConfig(env=process.env) {
 const provider=(env.AI_PROVIDER || (env.GROQ_API_KEY?'groq':'openai')).toLowerCase();
 if(provider==='groq') return {provider, key:env.GROQ_API_KEY||'', url:'https://api.groq.com/openai/v1/chat/completions', model:env.GROQ_MODEL||'openai/gpt-oss-120b'};
 if(provider==='openai') return {provider, key:env.OPENAI_API_KEY||'', url:'https://api.openai.com/v1/chat/completions', model:env.OPENAI_MODEL||'gpt-4o-mini'};
 throw Error('AI_PROVIDER must be groq or openai.');
}
