const mongoose = require("mongoose");
let levels;
let mongoUrl;
mongoose.set('strictQuery', true)
class DiscordXp {

  /**
  * @param {string} [dbUrl] - A valid mongo database URI.
  */

  static async setURL(dbUrl) {
    if (!dbUrl) throw new TypeError("A database url was not provided.");
    mongoUrl = dbUrl;
    return mongoose.connect(dbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  }
  /**
  * @param {string} [model] - The mongoose model.
  */
  static async setModel(model) {
    levels = model
  }
  /**
* @param {string} [userId] - Discord user id.
* @param {string} [guildId] - Discord guild id.
*/
  static async createUser(userId, guildId) {
    if (!userId) throw new TypeError("An user id was not provided.");
    if (!guildId) throw new TypeError("A guild id was not provided.");

    const isUser = await levels.findOne({ userId: userId, guildId: guildId });
    if (isUser) return false;

    const newUser = new levels({
      userId: userId,
      guildId: guildId
    });

    await newUser.save().catch(e => console.log(`Failed to create user: ${e}`));

    return newUser;
  }

  /**
  * @param {string} [userId] - Discord user id.
  * @param {string} [guildId] - Discord guild id.
  */

  static async deleteUser(userId, guildId) {
    if (!userId) throw new TypeError("An user id was not provided.");
    if (!guildId) throw new TypeError("A guild id was not provided.");

    const user = await levels.findOne({ userId: userId, guildId: guildId });
    if (!user) return false;

    await levels.findOneAndDelete({ userId: userId, guildId: guildId }).catch(e => console.log(`Failed to delete user: ${e}`));

    return user;
  }

  /**
  * @param {string} [userId] - Discord user id.
  * @param {string} [guildId] - Discord guild id.
  * @param {number} [xp] - Amount of xp to append.
  */

  static async appendXp(userId, guildId, xp) {
    if (!userId) throw new TypeError("An user id was not provided.");
    if (!guildId) throw new TypeError("A guild id was not provided.");
    if (xp == 0 || !xp || isNaN(parseInt(xp))) throw new TypeError("An amount of xp was not provided/was invalid.");
    const userXp = await levels.findOne({ guildId: guildId, userId: userId }).then(x => x?.xp || 0)
    const user = await levels.findOneAndUpdate({ guildId: guildId, userId: userId }, { $set: { xp: parseInt(xp, 10), level: Math.floor(0.1 * Math.sqrt(userXp + parseInt(xp, 10))) } }, { upsert: true }).catch(e => console.log(`Failed to append xp: ${e}`));
    if (!user) return false;
    return user.level;
  }

  /**
  * @param {string} [userId] - Discord user id.
  * @param {string} [guildId] - Discord guild id.
  * @param {number} [levels] - Amount of levels to append.
  */

  static async appendLevel(userId, guildId, levelss) {
    if (!userId) throw new TypeError("An user id was not provided.");
    if (!guildId) throw new TypeError("A guild id was not provided.");
    if (!levelss) throw new TypeError("An amount of levels was not provided.");
    const userLevel = await levels.findOne({ guildId: guildId, userId: userId }).then(x => x?.level || 0)
    const user = await levels.findOneAndUpdate({ guildId: guildId, userId: userId }, { $set: { xp: userLevel * userLevel * 100, level: parseInt(levelss, 10) } }, { upsert: true }).catch(e => console.log(`Failed to append level: ${e}`));
    if (!user) return false;
    return user;
  }

  /**
  * @param {string} [userId] - Discord user id.
  * @param {string} [guildId] - Discord guild id.
  * @param {number} [xp] - Amount of xp to set.
  */

  static async setXp(userId, guildId, xp) {
    if (!userId) throw new TypeError("An user id was not provided.");
    if (!guildId) throw new TypeError("A guild id was not provided.");
    if (xp == 0 || !xp || isNaN(parseInt(xp))) throw new TypeError("An amount of xp was not provided/was invalid.");
    const userXp = await levels.findOne({ guildId: guildId, userId: userId }).then(x => x?.xp || 0)
    const user = await levels.findOneAndUpdate({ guildId: guildId, userId: userId }, { $set: { xp: xp, level: Math.floor(0.1 * Math.sqrt(userXp)) } }, { upsert: true }).catch(e => console.log(`Failed to set xp: ${e}`));
    if (!user) return false;
    return user;
  }

  /**
  * @param {string} [userId] - Discord user id.
  * @param {string} [guildId] - Discord guild id.
  * @param {number} [level] - A level to set.
  */

  static async setLevel(userId, guildId, level) {
    if (!userId) throw new TypeError("An user id was not provided.");
    if (!guildId) throw new TypeError("A guild id was not provided.");
    if (!level) throw new TypeError("A level was not provided.");
    const user = await levels.findOneAndUpdate({ guildId: guildId, userId: userId }, { $set: { xp: level * level * 100, level: level } }, { upsert: true }).catch(e => console.log(`Failed to set xp: ${e}`));
    if (!user) return false;
    return user;
  }

  /**
  * @param {string} [userId] - Discord user id.
  * @param {string} [guildId] - Discord guild id.
  */

  static async fetch(userId, guildId, fetchPosition = false) {
    if (!userId) throw new TypeError("An user id was not provided.");
    if (!guildId) throw new TypeError("A guild id was not provided.");

    const user = await levels.findOne({
      userId: userId,
      guildId: guildId
    });
    if (!user) return false;

    if (fetchPosition === true) {
      const leaderboard = await levels.find({
        guildId: guildId
      }).sort([['xp', 'descending']]).exec();

      user.position = leaderboard.findIndex(i => i.userId === userId) + 1;
    }


    /* To be used with canvacord or displaying xp in a pretier fashion, with each level the cleanXp stats from 0 and goes until cleanNextLevelXp when user levels up and gets back to 0 then the cleanNextLevelXp is re-calculated */
    user.cleanXp = user.xp - this.xpFor(user.level);
    user.cleanNextLevelXp = this.xpFor(user.level + 1) - this.xpFor(user.level);

    return user;
  }

  /**
  * @param {string} [userId] - Discord user id.
  * @param {string} [guildId] - Discord guild id.
  * @param {number} [xp] - Amount of xp to subtract.
  */

  static async subtractXp(userId, guildId, xp) {
    if (!userId) throw new TypeError("An user id was not provided.");
    if (!guildId) throw new TypeError("A guild id was not provided.");
    if (xp == 0 || !xp || isNaN(parseInt(xp))) throw new TypeError("An amount of xp was not provided/was invalid.");
    const userE = await levels.findOne({ userId: userId, guildId: guildId });
    const user = await levels.findOneAndUpdate({ guildId: guildId, userId: userId }, { $set: { xp: (userE?.xp || 0) - xp, level: Math.floor(0.1 * Math.sqrt((userE?.xp || 0) - xp)) } }, { upsert: true }).catch(e => console.log(`Failed to subtract xp: ${e}`));
    if (!user) return false;
    return user;
  }

  /**
  * @param {string} [userId] - Discord user id.
  * @param {string} [guildId] - Discord guild id.
  * @param {number} [levels] - Amount of levels to subtract.
  */

  static async subtractLevel(userId, guildId, levelss) {
    if (!userId) throw new TypeError("An user id was not provided.");
    if (!guildId) throw new TypeError("A guild id was not provided.");
    if (!levelss) throw new TypeError("An amount of levels was not provided.");

    const userE = await levels.findOne({ userId: userId, guildId: guildId });
    if (!user) return false;
    const user = await levels.findOneAndUpdate({ guildId: guildId, userId: userId }, { $set: { xp: (userE?.level || 0) * (userE?.level || 0) * 100, level: (userE?.level || 0) * levelss } }, { upsert: true }).catch(e => console.log(`Failed to subtract level: ${e}`));
    return user;
  }

  /**
  * @param {string} [guildId] - Discord guild id.
  * @param {number} [limit] - Amount of maximum enteries to return.
  */


  static async fetchLeaderboard(guildId, limit) {
    if (!guildId) throw new TypeError("A guild id was not provided.");
    if (!limit) throw new TypeError("A limit was not provided.");
    let users = await levels.find({ guildId: guildId }).sort([['xp', 'descending']]).exec();
    return users.slice(0, limit);
  }

  /**
  * @param {string} [client] - Your Discord.CLient.
  * @param {array} [leaderboard] - The output from 'fetchLeaderboard' function.
  */

  static async computeLeaderboard(client, leaderboard, fetchUsers = false) {
    if (!client) throw new TypeError("A client was not provided.");
    if (!leaderboard) throw new TypeError("A leaderboard id was not provided.");
    if (leaderboard.length < 1) return [];
    const computedArray = [];
    if (fetchUsers) {
      for (const key of leaderboard) {
        const user = await client.users.fetch(key.userId) || { username: "Unknown", discriminator: "0000" };
        computedArray.push({
          guildId: key.guildId,
          userId: key.userId,
          xp: key.xp,
          level: key.level,
          position: (leaderboard.findIndex(i => i.guildId === key.guildId && i.userId === key.userId) + 1),
          username: user.username,
          discriminator: user.discriminator
        });
      }
    } else {
      leaderboard.map(key => computedArray.push({
        guildId: key.guildId,
        userId: key.userId,
        xp: key.xp,
        level: key.level,
        position: (leaderboard.findIndex(i => i.guildId === key.guildId && i.userId === key.userId) + 1),
        username: client.users.cache.get(key.userId) ? client.users.cache.get(key.userId).username : "Unknown",
        discriminator: client.users.cache.get(key.userId) ? client.users.cache.get(key.userId).discriminator : "0000"
      }));
    }
    return computedArray;
  }

  /*
  * @param {number} [targetLevel] - Xp required to reach that level.
  */
  static xpFor(targetLevel) {
    if (isNaN(targetLevel) || isNaN(parseInt(targetLevel, 10))) throw new TypeError("Target level should be a valid number.");
    if (isNaN(targetLevel)) targetLevel = parseInt(targetLevel, 10);
    if (targetLevel < 0) throw new RangeError("Target level should be a positive number.");
    return targetLevel * targetLevel * 100;
  }

  /**
  * @param {string} [guildId] - Discord guild id.
  */

  static async deleteGuild(guildId) {
    if (!guildId) throw new TypeError("A guild id was not provided.");
    const guild = await levels.findOne({ guildId: guildId });
    if (!guild) return false;
    await levels.deleteMany({ guildId: guildId }).catch(e => console.log(`Failed to delete guild: ${e}`));
    return guild;
  }
}

module.exports = DiscordXp;