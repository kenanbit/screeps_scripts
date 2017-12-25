module.exports = {
/*
Takes the field address of some desired value, and either returns it, or returns undefined if the field or a parent doesn't exist
[Game,'creeps',[Memory, 'f_name']] => is defined: Game['creeps'][Memory['f_name']]
*/
get: function(list) {
	if (arguments.length !== 1){
		message = "Function takes exactly one argument! Did you forget to make it a list?"

		throw message;
	}
	if (typeof list !== 'object')
		return list // Not actually a list, but a primitive of some sort
	if (list.length === 0)
		return undefined

	var val = list[0]
	for (var i = 1; i < list.length; i++) {
		if (val === undefined || val === null || typeof val !== 'object')
			return undefined //Won't be able to fetch a subvalue of this thing, so call it off before we fail
		var sub_val = this.get(list[i])
		if (sub_val === undefined)
			return undefined
		val = val[sub_val.toString()]
	}
	return val
},

//TODO finish
get_energy: function(structure){
	if (! structure)
		return 0
	if ( [STRUCTURE_STORAGE, STRUCTURE_CONTAINER, STRUCTURE_TERMINAL].includes(structure.structureType) ) {
		return structure.store.energy
	} else if (structure.structureType === STRUCTURE_LINK) {
		return structure.energy
	} else if ( this.get([structure, 'carry', 'energy']) !== undefined){
		//It's actually a creep :)
		return structure.carry.energy
	}
	return 0
},

replace_ticks: function(creep){
    return creep.body.length * CREEP_SPAWN_TIME
},

imminent_death: function(creep){
    return creep.ticksToLive <= this.replace_ticks(creep)
},
    
//It keeps running track of the cpu across different time intervals. It's not exactly an average, but I think it's close...
cpuTrack: function(){
    for (i in arguments){
            t = arguments[i]
            if ( [undefined, null].includes(Memory.cpuTrack[t]))
                    Memory.cpuTrack[t] = Game.cpu.getUsed()
            else
                    Memory.cpuTrack[t] = ( (t-1)*Memory.cpuTrack[t] + Game.cpu.getUsed()) / t
    }

    if (Memory.printCpu)
		console.log(JSON.stringify(Memory.cpuTrack))
},

//It keeps running track of the cpu across different time intervals. It's not exactly an average, but I think it's close...
cpuTrackRole: function(values){
    for (role in values){
        if (! Memory.cpuTrackRole[role]) Memory.cpuTrackRole[role]={}
        
        const times = [1,10,100,1000,10000]
        times.forEach((t) => {
            if ( [undefined, null].includes(Memory.cpuTrackRole[role][t]))
                    Memory.cpuTrackRole[role][t] = values[role].totalCpu / values[role].number
            else
                    Memory.cpuTrackRole[role][t] = ( (t-1)*Memory.cpuTrackRole[role][t] + values[role].totalCpu / values[role].number) / t
        })
    }
},

//Check if withdraw from a container/storage s by creep c is allowed and feasible
can_withdraw: function(c, s){
    rule = 'withdraw_spawn_empty'
    if (s.room.energyAvailable === s.room.energyCapacityAvailable) rule = 'withdraw_spawn_full'
    
    //console.log(rule)
    //console.log(this.get([Memory, s.id, rule]))
    //console.log(c.memory.role)

    rule_followed = 
        _.contains([1,undefined], this.get([Memory, s.id, rule])) || 
        _.contains(this.get([Memory, s.id, rule]), c.memory.role)
    return rule_followed
},

//Check if withdraw from a container/storage s by creep c is allowed and feasible
//TODO this function is WAY too heavy on the cpu
can_withdraw2: function(c, s){
   
    //First check for an explicitly set allow or disallow
    if (this.get([Memory, s.id, 'can_withdraw']) && this.get([Memory, s.id, 'can_withdraw']).contains(c.memory.role)){
        return true
    } else if (this.get([Memory, s.id, 'cannot_withdraw']) 
            && _.contains(this.get([Memory, s.id, 'cannot_withdraw']), c.memory.role)){
        return false
    }

    // Restockers
    if (c.memory.role == 'role_restocker') {
        var towers_need_filled = Memory.room_strategy[c.room.name].towers_need_filled
        var energy_need_filled = Memory.room_strategy[c.room.name].energy_need_filled
        if (towers_need_filled || energy_need_filled){
            //Give blanket approval to restockers trying to restock the things
            return true
        } else if (s.structureType == STRUCTURE_STORAGE || s.structureType == STRUCTURE_TERMINAL ||
                    (s.pos.lookFor('flag')[0] && ( s.pos.lookFor('flag')[0].name.includes('store')))){
            //If they aren't trying to restock the things, they should be 
            //depositing in storage and terminal, not taking from it
            //console.log(c.name)
            return false 
        }
    }
    //Everything else?
    return true
},

default_desired_hits: {
    [STRUCTURE_WALL]: 1000,
    [STRUCTURE_RAMPART]: 1000,
    [STRUCTURE_CONTAINER]: 50000
    //Structures not named here default to full value
},
get_desired_hits: function(structure){
    var value = this.get([Memory, 'room_strategy', structure.pos.roomName, structure.structureType, 'desired_hits'])
    if (value === undefined) value = this.default_desired_hits[structure.structureType]
    if (value === undefined) value = Infinity
    return value
},

get_room_level: function(roomName){
    var room = Game.rooms[roomName]
    if (! room)
        return -1
    var controller = room.controller
    if (! controller)
        return -2
    //otherwise
    return controller.level
    
}

};

