const { MongoMemoryServer } = require('mongodb-memory-server');

async function start() {
  const mongod = await MongoMemoryServer.create({
    instance: { port: 27117, dbName: 'ebook' },
  });
  console.log('DEV_MONGO_URI=' + mongod.getUri('ebook'));

  process.on('SIGINT', async () => {
    await mongod.stop();
    process.exit(0);
  });
}

start();
