const { Sequelize, DataTypes } = require('sequelize')

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './db.sqlite'
})



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
 * Модель связи пользователя и тэга
 */
const UserTagRel = sequelize.define('UserTagRel', {
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: "id"
        }
    },
    tagId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Tag,
            key: "id"
        }
    }
}, {
    timestamps: false
})
module.exports.UserTagRel = UserTagRel



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
})
module.exports.FriendRequest = FriendRequest



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



/**
 * Модель заявки на ивент
 */
const JoinRequest = sequelize.define('JoinRequest', {
    userId: {
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
    status: {
        type: DataTypes.ENUM('sent', 'accepted', 'rejected'),
        allowNull: false
    }
})
module.exports.JoinRequest = JoinRequest



/**
 * Модель связи ивента и тэга
 */
const EventTagRel = sequelize.define('EventTagRel', {
    eventId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Event,
            key: "id"
        }
    },
    tagId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Tag,
            key: "id"
        }
    }
}, {
    timestamps: false
})
module.exports.EventTagRel = EventTagRel



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



/**
 * Модель избранных ивентов
 */
const Favorites = sequelize.define('Favorites', {
    userId: {
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
    }
}, {
    timestamps: false
})
module.exports.Favorites = Favorites


/**
 * Модель просмотренных ивентов
 */
const ViewedEvents = sequelize.define('ViewedEvents', {
    userId: {
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
    }
}, {
    timestamps: false
})
module.exports.ViewedEvents = ViewedEvents



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