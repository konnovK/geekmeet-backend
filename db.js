const { Sequelize, DataTypes } = require('sequelize')

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './db.sqlite'
})


// ОСНОВНЫЕ МОДЕЛИ
/**
 * Модель пользователя
 */
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
        type: DataTypes.TEXT
    }
}, {
    timestamps: false
})
module.exports.User = User



/**
 * Модель тэга
 */
const Tag = sequelize.define('Tag', {
    title: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    timestamps: false
})
module.exports.Tag = Tag



/**
 * Модель адреса
 */
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
}, {
    timestamps: false
})
module.exports.Address = Address



/**
 * Модель ивента
 */
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
        allowNull: false,
        references: {
            model: Address,
            key: "id"
        }
    },
    creatorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: "id"
        }
    },
    about: {
        type: DataTypes.TEXT,
    },
    photo: {
        type: DataTypes.TEXT
    },
    seats: {
        type: DataTypes.INTEGER
    }
}, {
    timestamps: false
})
module.exports.Event = Event






// МОДЕЛИ СВЯЗЕЙ
/**
 * Связь ивента и пользователя-создателя
 */
Event.belongsTo(User, {as: 'Creator', foreignKey: 'creatorId'})
User.hasMany(Event, {foreignKey: 'creatorId'})



/**
 * Модель заявки на ивент
 */
const JoinRequest = sequelize.define('JoinRequest', {
    status: {
        type: DataTypes.ENUM('sent', 'accepted', 'rejected'),
        allowNull: false
    }
}, {
    timestamps: false
})
User.belongsToMany(Event, {through: JoinRequest})
Event.belongsToMany(User, {as: 'Member', through: JoinRequest})
module.exports.JoinRequest = JoinRequest



/**
 * Связь ивента и адреса
 */
Event.belongsTo(Address, {foreignKey: 'addressId'})
Address.hasMany(Event, {foreignKey: 'addressId'})



/**
 * Модель связи пользователя и тэга
 */
const UserTagRel = sequelize.define('UserTagRel', {}, {timestamps: false})
User.belongsToMany(Tag, {through: UserTagRel})
Tag.belongsToMany(User, {through: UserTagRel})
module.exports.UserTagRel = UserTagRel



/**
 * Модель связи ивента и тэга
 */
const EventTagRel = sequelize.define('EventTagRel', {}, {timestamps: false})
Event.belongsToMany(Tag, {through: EventTagRel})
Tag.belongsToMany(Event, {through: EventTagRel})
module.exports.EventTagRel = EventTagRel



/**
 * Модель избранных ивентов
 */
const Favorites = sequelize.define('Favorites', {}, {timestamps: false})
User.belongsToMany(Event, {as: 'Favorite', through: Favorites})
Event.belongsToMany(User, {as: 'Favorite', through: Favorites})
module.exports.Favorites = Favorites


/**
 * Модель просмотренных ивентов
 */
const ViewedEvents = sequelize.define('ViewedEvents', {}, {timestamps: false})
User.belongsToMany(Event, {as: 'Viewed', through: ViewedEvents})
Event.belongsToMany(User, {as: 'Viewed', through: ViewedEvents})
module.exports.ViewedEvents = ViewedEvents



/**
 * Модель запроса в друзья
 */
const FriendRequest = sequelize.define('FriendRequest', {
    fromUserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: "id"
        }
    },
    toUserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: "id"
        }
    },
    status: {
        type: DataTypes.ENUM('sent', 'accepted', 'rejected'),
        allowNull: false
    }
}, {
    timestamps: false
})
module.exports.FriendRequest = FriendRequest



/**
 * Модель сообщения личного чата
 */
const PrivateMessage = sequelize.define('PrivateMessage', {
    fromUserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: "id"
        }
    },
    toUserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: "id"
        }
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



/**
 * Модель сообщения группового чата
 */
const GroupMessage = sequelize.define('GroupMessage', {
    fromUserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: "id"
        }
    },
    eventId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Event,
            key: "id"
        }
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