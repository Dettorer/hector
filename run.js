const Hector = require('./hector.js');

if (require.main === module) {
    var client = new Hector.Client('./config.json', './commands', './games');

    client.run();
}