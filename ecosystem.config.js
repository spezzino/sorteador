module.exports = {
  apps : [{
    name: "sorteador",
    script: "./bin/www",
    watch       : true,
    ignore_watch : ["uploads"],
    env: {
      NODE_ENV: "development",
      DEBUG: "sorteador:*"
    },
    env_production: {
      NODE_ENV: "production",
      DEBUG: "sorteador:*"
    }
  }]
}