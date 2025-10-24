module.exports = {
  apps: [{
    name: 'tour-ease-app',      
    script: 'npm',           
    args: 'run start',         
    env: {
      NODE_ENV: 'development',
      PORT: 3003             
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 80                
    }
  }]
};