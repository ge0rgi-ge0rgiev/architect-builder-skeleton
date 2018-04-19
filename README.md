# architect-builder-skeleton for building new rapid development node applications

Node 8.9.4
Ecma2016
(no async/await)

Autodiscovery of plugins in folder plugin and node_modules

Plugins are the following format:
  Example:
  /node_modules
  /plugins
    /chat
      -package.json
        {
          "name": "chat",
          "version": "0.1.0",
          "main": "chatPlugin.js",
          "plugin": true
        }
      -chatPlugin.js
        module.exports = ['chat', ({dependency1}) => {return { chat: {} }];
        
