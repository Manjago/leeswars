/**
 * Level 8
**/

global turn = 0;

turn++;
debug("=== Turn " + turn);


debug("=== Amplify phase " + turn + " " + getTP());
amplifyPhase();

if (getLife() < getTotalLife() * 0.75) {
    immediateHeal()
    debug("Immediate heal, tp " + getTP())
}

var enemy = realEnemy()

var targetCell = getCellToUseChip(CHIP_PEBBLE, enemy)
mark(targetCell, getColor(255, 0, 0), 1)

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


function amplifyPhase() {
    var proteinCoolDown = getCooldown(CHIP_PROTEIN);
    if (proteinCoolDown == 0) {
        debug("Use protein");
        useChip(CHIP_PROTEIN, getEntity());
    } else {
        debug("Protein cooldown " + proteinCoolDown)
    }
}

function atEnd() {
    immediateHeal()
    debug("Immediate heal at end, tp " + getTP())
}

function tryPistol(enemy) {
    var canPistol = canUseWeapon(WEAPON_PISTOL, enemy)
    debug("Pistol status " + canPistol + " " + getTP())
    if (canPistol && (getTP() >= 4)) {
        setWeapon(WEAPON_PISTOL)
        useWeapon(enemy)
        debug("pistol used first, now tp " + getTP())

        while (canUseWeapon(WEAPON_PISTOL, enemy) && (getTP() >= 3)) {
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
    debug("may pebble " + mayPebble)
    if (mayPebble) {
        usePebble(enemy)
    }

    var moved = moveTowardCell(targetCell)
    if (targetCell == getCell()) {
        debug("may shock")
        useShock(enemy)
    }

    var pretendersShock = getCellsToUseChip(CHIP_PEBBLE, enemy)
    var allow = (pretendersShock != null) && inArray(pretendersShock, enemy)
    if (allow) {
        while (getTP() >= 2) {
            useChip(CHIP_PEBBLE, enemy)
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
    while(getTP() >= 2 && (getLife(enemy) != 0)) {
        useChip(CHIP_SHOCK, enemy)
        debug("Use shock, now tp " + getTP())
    }

    debug("Stop use shock, tp " + getTP())
}

function strategyNoIdea(enemy) {
    debug("Target cell not ok")
    var moved = moveToward(enemy)
    debug("moved to enemy " + moved)
}