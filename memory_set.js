//Gives some standard settings for different controller levels and situations
//
// Example:
// require('memory_set').controller1_basic('E27S24')

module.exports = {
    
    //This is a good method to call for the first ever room, to get everything up and running
    controller1_basic: function(roomName){
        Memory.room_strategy[roomName]={
            'spawn_priority': ['role_harvester', 'role_guard', 'role_upgrader', 'role_builder', 'role_claimer' ],
            'role_harvester': {'desired_number':1, 'parts':[MOVE,WORK,CARRY] },
            'role_guard': {'desired_number':1, 'parts':[MOVE,ATTACK,TOUGH,TOUGH] },
            'role_upgrader': {'desired_number':1, 'parts':[MOVE,WORK,CARRY] },
            'role_builder': {'desired_number':3, 'parts':[MOVE,WORK,CARRY] },
            'role_solominer': {'parts':[WORK,WORK,WORK,WORK,WORK,MOVE]} //Don't make this until you're shifting to the next
        }
    },

    //Once you have lvl2, 5 extensions, and container(s) by the source(s)
    //When switching to this, make sure you place a 'solomine*' flag to create the solominer(s)!
    controller2_solomining: function(roomName){
        Memory.room_strategy[roomName]={
            'spawn_priority': ['role_restocker', 'role_solominer', 'role_guard', 'role_upgrader', 'role_builder', 'role_claimer' ],
            'role_harvester': {'desired_number':0, 'parts':[MOVE,WORK,CARRY] },
            'role_restocker': {'desired_number':2, 'parts':[MOVE, CARRY, CARRY] },
            'role_guard': {'desired_number':1, 'parts':[MOVE,ATTACK,TOUGH,TOUGH] },
            'role_upgrader': {'desired_number':1, 'parts':[MOVE,WORK,CARRY] },
            'role_builder': {'desired_number':3, 'parts':[MOVE, MOVE, WORK,WORK, CARRY,CARRY] },
            'role_solominer': {'parts':[WORK,WORK,WORK,WORK,WORK, MOVE]} //You need 5 extensions before you can make this one
        }
    },

    //When wanting to claim a new room and send workers there, call this on the new room
    // E.g. require('memory_set').bootstrap_room('E28S22', 'E27S24')
    bootstrap_room: function(roomName, fromRoom){
        Memory.room_strategy[roomName]={
            'spawn_priority':['role_claimer', 'role_builder'],
            'role_claimer':{'spawn_room':fromRoom},
            'role_builder':{'spawn_room':fromRoom, 'parts':[MOVE,MOVE, WORK,WORK, CARRY,CARRY], 'desired_number':1}
        }
    },
    
    

    //For controller level 3. Solomining is assumed by this point. Prioritize building the new extensions and a tower
    controller3: function(roomName){
        Memory.room_strategy[roomName]={
            'spawn_priority': ['role_restocker', 'role_solominer', 'role_guard', 'role_upgrader', 'role_builder', 'role_claimer' ],
            'role_harvester':{'desired_number':0, 'parts':[MOVE,WORK,CARRY] },
            'role_restocker':{'desired_number':2, 'parts':[MOVE, CARRY,CARRY] },
            'role_guard':    {'desired_number':1, 'parts':[MOVE,MOVE,ATTACK,ATTACK,TOUGH,TOUGH] },
            'role_upgrader': {'desired_number':1, 'parts':[MOVE,MOVE, WORK,WORK, CARRY,CARRY] },
            'role_builder':  {'desired_number':3, 'parts':[MOVE,MOVE,MOVE, WORK,WORK,WORK, CARRY,CARRY,CARRY] },
            'role_solominer':{'parts':[WORK,WORK,WORK,WORK,WORK, MOVE]}
        }
    },


    //For controller level 3, to minimize the creep count for CPU
    controller3_minimal: function(roomName){
        Memory.room_strategy[roomName]={
            'spawn_priority': ['role_restocker', 'role_solominer', 'role_guard', 'role_upgrader', 'role_builder', 'role_claimer' ],
            'role_harvester':{'desired_number':0, 'parts':[MOVE,WORK,CARRY] },
            'role_restocker':{'desired_number':1, 'parts':[MOVE,MOVE, CARRY,CARRY,CARRY,CARRY] },
            'role_guard':    {'desired_number':1, 'parts':[MOVE,MOVE,ATTACK,ATTACK,TOUGH,TOUGH] },
            'role_upgrader': {'desired_number':0, 'parts':[MOVE,MOVE, WORK,WORK, CARRY,CARRY] },
            'role_builder':  {'desired_number':2, 'parts':[MOVE,MOVE,MOVE,MOVE, WORK,WORK,WORK, CARRY,CARRY,CARRY,CARRY] },
            'role_solominer':{'parts':[WORK,WORK,WORK,WORK,WORK, MOVE]}
        }
    },

    //For controller level 4, to minimize the creep count for CPU
    controller4_minimal: function(roomName){
        Memory.room_strategy[roomName]={
            'spawn_priority': ['role_restocker', 'role_solominer', 'role_guard', 'role_upgrader', 'role_builder', 'role_claimer' ],
            'role_harvester':{'desired_number':0, 'parts':[MOVE,WORK,CARRY] },
            'role_restocker':{'desired_number':1, 'parts':[MOVE,MOVE, CARRY,CARRY,CARRY,CARRY] },
            'role_guard':    {'desired_number':1, 'parts':[MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK] },
            'role_upgrader': {'desired_number':0, 'parts':[MOVE,MOVE, WORK,WORK, CARRY,CARRY] },
            'role_builder':  {'desired_number':2, 'parts':[MOVE,MOVE,MOVE,MOVE, WORK,WORK,WORK,WORK, CARRY,CARRY,CARRY,CARRY] },
            'role_solominer':{'parts':[WORK,WORK,WORK,WORK,WORK, MOVE]}
        }
    },
}
