export function logInfo(message, data = {}) {
    console.log(JSON.stringify({ level: 'INFO', message, ...data }));
}

export function logError(message, error) {
    console.error(JSON.stringify({ 
        level: 'ERROR', 
        message, 
        error: error.message, 
        stack: error.stack }));
}