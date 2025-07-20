module.exports = {
  apps: [
    {
      name: 'next-app',
      script: 'npm',
      args: 'start',
      instances: 'max', // 根据CPU核心数启动多个实例
      exec_mode: 'cluster', // 使用集群模式
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000 // 可以指定端口
      }
    }
  ]
};
