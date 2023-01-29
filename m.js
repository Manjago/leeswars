global turn = 0;

turn += 1;
debug("=== Turn " + turn);

var enemy = singleEnemy()

debug("=== Check flee phase");
var shouldFlee = checkFlee(enemy)

debug("=== Naive prepare phase");
var bestWeapon = getBestWeapon(enemy);
if (bestWeapon != null)
    equipWeapon(bestWeapon);

debug("=== Movement phase");
tryMove(enemy);
    
debug("=== Action phase");
shouldFlee = actionLoop(enemy)

debug("==== Flee phase");
tryFlee(enemy, shouldFlee)

debug(getOperations() + " operations");

function checkFlee(enemy) {
    return getLife() < getTotalLife() * 0.5
}

function tryFlee(enemy, shouldFlee) {
    moveAwayFrom(enemy)
}

function actionLoop(enemy) {
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

function inWeaponRange(enemy, weapon) {
    var me = getCell();
    var them = getCell(enemy);
    return lineOfSight(me, them)
        && getCellDistance(me, them) <= getWeaponMaxRange(weapon);
}

function tryMove(enemy) {
    var mpUsed = 1;
    while (getMP() > 0
        && !inWeaponRange(enemy, getWeapon())
        && mpUsed > 0) {
        debug("In range: " + inWeaponRange(enemy, getWeapon()));
        mpUsed = moveToward(enemy, 1);
        debug(" > MOVE");
    }
}

function equipWeapon(weapon) {
    if (getWeapon() != weapon) {
        debug("WEAPON: " + getWeaponName(weapon));
        setWeapon(weapon);
    }
}


function getBestWeapon(enemy) {
    return WEAPON_PISTOL
}


function singleEnemy() {
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