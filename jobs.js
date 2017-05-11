var f = require('f')

module.exports = {

//TODO refactor this anyway?
check_withdraw: function(c, noCheckEmpty, nomove, leaveEnergyAmount){
    if (! leaveEnergyAmount)
        leaveEnergyAmount=0
        
    var needs = c.carryCapacity - _.sum(c.carry)
    if (needs == 0)
        return false
        
    if (noCheckEmpty || f.get_energy(c) == 0) {

    	//Check these structures, and only check terminals if the room has below half a storage full
    	types = [STRUCTURE_CONTAINER, STRUCTURE_LINK]
    	if (! (f.get_energy(c.room.storage) > 500000))
    		types.push(STRUCTURE_TERMINAL)
    	//Only allow restockers to take from storage if we are above half storage or if we don't have much energy in the terminal
    	if (c.memory.role !== 'role_restocker'
    			|| f.get_energy(c.room.terminal) < c.carryCapacity
    			|| f.get_energy(c.room.storage) > 500000)
    		types.push(STRUCTURE_STORAGE)

        store = c.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (s) => types.includes( s.structureType)
                	&& f.get_energy(s) > needs + leaveEnergyAmount 
                	&& (!  (s.pos.lookFor('flag')[0] && ( s.pos.lookFor('flag')[0].name.includes('sender'))))               
        });
        if (store) {
            //Calculate how much can be given
            energyContained = store.energy
            if (! energyContained){
                energyContained = store.store.energy
            }
            if (! energyContained){
                console.log('whoops')
            }

            amount = _.min([energyContained - leaveEnergyAmount, needs])
            
            //Try to do the withdrawl
            r = c.withdraw(store, "energy", amount)
            if (r == ERR_NOT_IN_RANGE){
                if (nomove)
                    return false
                c.moveTo(store)
                return store
            }
            if (r==OK)
                return store
        }
    }
    return false
},

check_solomining: function(c, flag_name){
    if ( (! Game.flags[flag_name]) || f.get_energy(c) == c.carryCapacity)
        return false
    var target = Game.flags[flag_name].pos.lookFor('source')[0] //GOTCHA: It return a list, in this case a list of one...
    
    if (target){
        var r = c.harvest(target)
        if (r == ERR_NOT_IN_RANGE){
            c.moveTo(target, {visualizePathStyle: {stroke: '#ff0', opacity: .3}});
        }
        return target
    }
},

//TODO upgraders and maybe others don't pick up resources next to them while upgrading? Maybe it's because they are withdrawing from a neighboring container too quickly.
check_ondropped: function(c){
    var dropped = c.pos.findInRange(FIND_DROPPED_ENERGY, 1)[0]
    if (!dropped)
    	return false
    r = c.pickup(dropped)
    //console.log('picking up: '+r)
    return dropped
},

check_dropped: function(c){
    var dropped = c.pos.findClosestByPath(FIND_DROPPED_ENERGY)
    if (! dropped)
    	return false

    var r = c.pickup(dropped)
    if (r == ERR_NOT_IN_RANGE){
        c.moveTo(dropped)
        return dropped
    }
    if (r == OK)
        return dropped
},

check_terminal: function(c) {
	terminal = c.room.terminal; 
	storage = c.room.storage
	if (terminal && storage){
		if (f.get_energy(storage) > storage.storeCapacity * 2/3){
			//Energy surplus here, so take from the storage to the terminal
			from = storage; to = terminal
		}
		else if (f.get_energy(storage) < storage.storeCapacity / 2 && f.get_energy(terminal) > 0) {
			//Energy deficit here, so take from the terminal and place into storage
			from = terminal; to = storage
		} else {
			//Energy balanced here. No giving or receiving
			return false
		}

		if (f.get_energy(c) > 0){
			//Deposit in the receiving structure
			r = c.transfer(to, RESOURCE_ENERGY)
			if (r === ERR_NOT_IN_RANGE){
				c.moveTo(to)
				return true
			}
			if (r === OK) {
				return true
			}
			console.log('Could not deposit energy: '+r)
		}
		else {
			//TODO this segment may never get reached, since the restockers check_withdraw when they have no energy. Is it needed?
			console.log(from)
			//Withdraw from the giving structure
			r = c.withdraw(from, RESOURCE_ENERGY)
			if (r === ERR_NOT_IN_RANGE){
				c.moveTo(to)
				return true
			}
			if (r === OK) {
				return true
			}
			console.log('Could not withdraw energy: '+r)
		}
	}
},



sign_controller: function(c, roomName, message){
	if (c.room.name !== roomName){
		c.moveTo(new RoomPosition(15, 15, roomName))
		return true
	}
	controller = get([Game.rooms[roomName], 'controller'])
	if (! controller){
		console.log('no controller in this room?')
		return false
	}
	r = c.signController(controller, message)
	if (r == ERR_NOT_IN_RANGE){
		c.moveTo(controller)
		return true
	}
	if (r == OK){
		Game.flags[c.memory.flag].remove()
		return true
	}
},

check_invaders: function(c){
    var target = c.pos.findClosestByPath(FIND_HOSTILE_CREEPS);
    if (target){
        r = c.attack(target) 
        if (r == ERR_NOT_IN_RANGE) {
            c.moveTo(target, {visualizePathStyle: {stroke: '#f00', opacity: .6}});
            return target
        }
        if (r==OK)
            return target
    }
},

check_barracks: function(c){
    var flag = c.room.find(FIND_FLAGS, {filter: (f) => f.name.includes('barrack')})[0]
    if (flag){
        c.moveTo(flag.pos)
    }
    return flag
},

check_mining: function(c){
    if ( (! c.memory.mining) && f.get_energy(c) == 0) {
        var mine = c.pos.findClosestByPath(FIND_SOURCES, {filter: (s) =>
        	//If there is a flag on the source position whose name is in memory, with the value of a currently living creep
            (! f.get(  [Game, 'creeps', [Memory, [s.pos.lookFor('flag')[0], 'name']]]  ))
            //TODO also if it's not in the room/not mining?
        })
        if (mine) {
            c.memory.mining = mine.id
        }
    } else if (c.memory.mining && f.get_energy(c) == c.carryCapacity) {
        c.memory.mining = false
    }
    if (c.memory.mining){
        var target = Game.getObjectById(c.memory.mining);
        if (c.harvest(target) == ERR_NOT_IN_RANGE){
            c.moveTo(target, {visualizePathStyle: {stroke: '#ff0', opacity: .3}})
        }
    }
    return c.memory.mining
},

check_spawn: function(c){
	if (f.get_energy(c) == 0)
		return false
    var target = c.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: (s) => {
            return (s.structureType == STRUCTURE_EXTENSION ||
            s.structureType == STRUCTURE_SPAWN) && s.energy < s.energyCapacity;
        }
    });
    if (target) {
    	r = c.transfer(target, RESOURCE_ENERGY)
        if(r == ERR_NOT_IN_RANGE)
            c.moveTo(target, {visualizePathStyle: {stroke: '#ffffff', opacity: .3}});
    }
    return target
},

check_towers: function(c){
	if (f.get_energy(c) == 0)
		return false
    var target = c.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: (s) => s.structureType == STRUCTURE_TOWER && s.energy < (s.energyCapacity * .90)
    });
    if (target) {
        if(c.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            c.moveTo(target, {visualizePathStyle: {stroke: '#ffffff', opacity: .3}});
        }
    }
    return target
},

upgrade_controller: function(c) {
    var r = c.upgradeController(c.room.controller)
    
    if(r === ERR_NOT_IN_RANGE) {
        c.moveTo(c.room.controller, {visualizePathStyle: {stroke: '#00ff00', opacity: .3}});
        return c.room.controller
    }
    else if (r===OK){
        //Try to pull more energy from any storage that might be nearby, but only if there is enough to fill up and leave some for other important stuff, like maybe restockers want it
        this.check_withdraw(c, true, true, 100)
        return true
    }
    return false
},

claim_controller: function(c, flag_name){
    var flag = Game.flags[flag_name]
    if (! flag)
        return false

    var pos = flag.pos
    var controller = pos.lookFor(LOOK_STRUCTURES)[0]

    if (controller) {
        
        var r = c.claimController(controller)
        if( _.contains([ERR_NOT_IN_RANGE, ERR_INVALID_TARGET], r)) {
            c.moveTo(pos);
            return true
        } 
        else if (r == ERR_GCL_NOT_ENOUGH) {
            if( _.contains([ERR_NOT_IN_RANGE, ERR_INVALID_TARGET], c.reserveController(controller))) {
                c.moveTo(pos);
            }
            return true
        } 
        else if (r == OK) {
            Game.flags[flag_name].remove()
            message = 'Room '+controller.room.name+' has been claimed.'
            console.log(message)
            Game.notify(message)
            return false //Because we might still be able to do something else
        } 
        else {
            console.log("Could not claim controller: "+r)
            return false
        }
    }
    
},

check_home_room: function(c) {
	if (! c.memory.home_room){
		c.memory.home_room = c.room.name
		return false //We've decided this is home
	}
    if (c.room.name === c.memory.home_room)
        return false //We're already there
    else {
        var r = c.moveTo(new RoomPosition(25,25, c.memory.home_room), {visualizePathStyle: {stroke: '#ff0', opacity: .3}} )
        c.say("to "+ c.memory.home_room)
        return c.memory.home_room
    }
},

check_construction: function(c){
    var target = c.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
    if (target){
        var r = c.build(target)
        if (r == ERR_NOT_IN_RANGE) {
            c.moveTo(target, {visualizePathStyle: {stroke: '#00f', opacity: .3}})
            return target
        }
        if (r==OK)
            return target
    }
},

check_store: function(c){
    if (_.sum(c.carry)>0) {
        store = c.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (s) =>  (s.structureType == STRUCTURE_STORAGE ||
                            s.structureType == STRUCTURE_CONTAINER) &&
                            s.store.energy < s.storeCapacity
                            
        });
        //TODO change or remove this to help solominers not wander away
        if (store) {
            r = c.transfer(store, "energy")
            //Only go out of your way to store energy if you're full
            if (r == ERR_NOT_IN_RANGE && f.get_energy(c) == c.carryCapacity){
                c.moveTo(store)
                return store
            }
            if (r==OK)
                return store
        }
    }
},

//TODO add parameter for movement?
check_store_link: function(c){
    if (_.sum(c.carry)>0) {
        store = c.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (s) =>  s.structureType == STRUCTURE_LINK && s.energy < s.energyCapacity
        });
        if (store) {
            var r = c.transfer(store, 'energy')
            if (r == ERR_NOT_IN_RANGE){
                //Never go out of your way?
                //c.moveTo(store)
                //return store
            }
            if (r==OK) {
                return store
                
            }
        }
    }
    
}

};