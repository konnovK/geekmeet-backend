const { Sequelize, DataTypes } = require('sequelize')

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './db.sqlite'
})

// Адрес ивента
const Address = sequelize.define('Address',{
    name: {
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



// Пользователь
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



// Ивент
const Event = sequelize.define('Event', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    addressId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    creatorId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    about: {
        type: DataTypes.TEXT,
    },
    photo: {
        type: DataTypes.STRING
    },
    seats: {
        type: DataTypes.INTEGER
    }
})
module.exports.Event = Event



// Тэг
const Tag = sequelize.define('Tag', {
    title: {
        type: DataTypes.STRING,
        allowNull: false
    }
})
module.exports.Tag = Tag



// Связь пользователя и тэга
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



// Запрос в друзья
const FriendRequest = sequelize.define('FriendRequest', {
    fromUserId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    toUserId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    accepted: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    }
})
module.exports.FriendRequest = FriendRequest



// таблица заявок пользователей на ивент
const JoinRequest = sequelize.define('JoinRequest', {
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    eventId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    accepted: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    }
})
module.exports.JoinRequest = JoinRequest



// таблица ивент-тэг
const EventTagRel = sequelize.define('EventTagRel', {
    eventId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    tagId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
})
module.exports.EventTagRel = EventTagRel



// сообщения личного чата
const PrivateMessage = sequelize.define('PrivateMessage', {
    fromUserId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    toUserId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    messageText: {
        type: DataTypes.STRING,
        allowNull: false
    }
})
module.exports.PrivateMessage = PrivateMessage



// сообщения группового чата
const GroupMessage = sequelize.define('GroupMessage', {
    fromUserId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    eventId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    messageText: {
        type: DataTypes.STRING,
        allowNull: false
    }
})
module.exports.GroupMessage = GroupMessage



async function init() {
    await sequelize.sync()
}

async function drop() {
    await sequelize.drop()
}

async function truncate() {
    await sequelize.truncate()
}

module.exports.init = init
module.exports.drop = drop
module.exports.truncate = truncate