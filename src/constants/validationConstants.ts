// src/constants/validationConstants.ts

export const COMMON_PORTS = new Set([
    80, 443, 8080, 8443,  // HTTP/HTTPS
    21, 22, 23, 25, 53,   // Common services
    3000, 3001, 5000, 8000, 8001, 8888 // Development
  ]);
  
  export const VALID_METHODS = new Set([
    'GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS',
    'CONNECT', 'TRACE', 'PATCH'
  ]);
  
  export const VALID_PROTOCOLS = new Set([
    'http', 'http2', 'http3', 'nginx_loris', 'tcp', 'udp'
  ]);
  
  export const REQUIRED_TARGET_FIELDS = [
    'target_id',
    'request_id',
    'host',
    'ip',
    'type',
    'method',
    'port',
    'path',
    'body'
  ];