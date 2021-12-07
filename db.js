const { Sequelize, Model, DataTypes } = require('sequelize')

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './db.sqlite'
})

const Address = sequelize.define('Address',{
    place: {
        type: DataTypes.STRING,
        allowNull: false
    },
    address: {
        type: DataTypes.STRING,
        allowNull: false
    },
    metro: {
        type: DataTypes.STRING
    }
})
module.exports.Address = Address



const User = sequelize.define('User', {
    login: {
        type: DataTypes.STRING,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    about: {
        type: DataTypes.TEXT,
    },
    avatar: {
        type: DataTypes.STRING
    }
})
module.exports.User = User



const Tag = sequelize.define('Tag', {
    title: {
        type: DataTypes.STRING,
        allowNull: false
    }
})
module.exports.Tag = Tag



const UserTagRel = sequelize.define('UserTagRel', {
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    tagId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
})
module.exports.UserTagRel = UserTagRel



const GroupChatMessage = sequelize.define('GroupChatMessage', {
    authorId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
})

async function init() {
    await sequelize.sync()
}

module.exports.init = init