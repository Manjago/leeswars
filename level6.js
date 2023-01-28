/**
 * Level 6
**/

setWeapon(WEAPON_PISTOL)

if (getCooldown(CHIP_PROTEIN) == 0) {
    debug("Use protein")
    useChip(CHIP_PROTEIN, getEntity())
}

if (getLife() < getTotalLife() * 0.75) {
    immediateHeal()
    debug("Immediate heal, tp " + getTP())
}

var enemy = realEnemy()

var targetCell = getCellToUseChip(CHIP_SHOCK, enemy)

if (getLife() < getTotalLife() * 0.5) {
    debug("strategy retreat")
    strategyRetreat(enemy)
} else if (targetCell != null) {
    debug("strategy wanna cheap")
    strategyWannaCheap(targetCell, enemy)
} else {
    debug("strategy no idea")
    strategyNoIdea(enemy)
}


tryPistol(enemy)
atEnd()


function atEnd() {
    immediateHeal()
    debug("Immediate heal at end, tp " + getTP())
}

function tryPistol(enemy) {
    var canPistol = canUseWeapon(WEAPON_PISTOL, enemy)
    debug("Pistol status " + canPistol + " " + getTP())
    if (canPistol && (getTP() >= 2)) {
        useWeapon(enemy)
        debug("pistol used first, now tp " + getTP())

        while (canUseWeapon(WEAPON_PISTOL, enemy) && (getTP() >= 2)) {
            useWeapon(enemy)
            debug("pistol used again, now tp " + getTP())
        }
    }
}

function realEnemy() {
    var pretenders = getAliveEnemies()
    var realEnemies = arrayFilter(pretenders, function (v) {
        return getType(v) != ENTITY_CHEST
    })

    if (isEmpty(realEnemies)) {
        return getNearestEnemy()
    } else {
        return realEnemies[0]
    }
}

function immediateHeal() {
    if ((getCooldown(CHIP_BANDAGE) == 0) && (getLife() < getTotalLife()) && (getTP() >= 2)) {
        useChip(CHIP_BANDAGE)
        debug("Use bandage, has tp " + getTP())
    } else {
        debug("Fail use bandage")
    }
}

function strategyRetreat(enemy) {
    immediateHeal()
    moveAwayFrom(enemy)
}

function strategyWannaCheap(targetCell, enemy) {

    var pretendersPebble = getCellsToUseChip(CHIP_PEBBLE, enemy)
    var mayPebble = (pretendersPebble != null) && inArray(pretendersPebble, enemy)
    mark(pretendersPebble, getColor(255, 0, 0), 1)
    debug("may pebble " + mayPebble)
    if (mayPebble) {
        usePebble(enemy)
    }

    var moved = moveTowardCell(targetCell)
    if (targetCell == getCell()) {
        debug("may shock")
        useShock(enemy)
    }

    var pretendersShock = getCellsToUseChip(CHIP_SHOCK, enemy)
    var allow = (pretendersShock != null) && inArray(pretendersShock, enemy)
    if (allow) {
        while (getTP() >= 2) {
            useChip(CHIP_SHOCK, enemy)
        }
    }

}

function usePebble(enemy) {
    if ((getCooldown(CHIP_PEBBLE) == 0) and(getTP() >= 2)) {
        useChip(CHIP_PEBBLE, enemy)
        debug("Use pebble, now tp " + getTP())
    } else {
        debug("Fail use pebble, tp " + getTP())
    }
}

function useShock(enemy) {
    if (getTP() >= 2) {
        useChip(CHIP_SHOCK, enemy)
        debug("Use shock, now tp " + getTP())
    } else {
        debug("Fail use shock, tp " + getTP())
    }
}

function strategyNoIdea(enemy) {
    debug("Target cell not ok")
    var moved = moveToward(enemy)
    debug("moved to enemy " + moved)
}