// Test script untuk debug IndexedDB
import { chatDB } from './db';

export async function testAgentDB() {
    console.log('=== Testing Agent DB ===');
    
    // Init DB
    await chatDB.init();
    console.log('✓ DB Initialized');
    
    // Get all agent sessions
    const sessions = await chatDB.getAllAgentSessions();
    console.log('📋 Agent Sessions:', sessions.length);
    sessions.forEach(s => {
        console.log(`  - ${s.title} (${s.models.length} models)`);
    });
    
    // Get responses for each session
    for (const session of sessions) {
        const responses = await chatDB.getAgentResponsesBySession(session.id);
        console.log(`  💬 ${session.title}: ${responses.length} turns`);
        responses.forEach((r, i) => {
            console.log(`    Turn ${i+1}: "${r.userMessage.substring(0, 30)}..."`);
            console.log(`      Responses: ${r.responses.length} models`);
            r.responses.forEach(resp => {
                console.log(`        - ${resp.modelName}: ${resp.content ? 'OK' : 'EMPTY'}`);
            });
        });
    }
}
