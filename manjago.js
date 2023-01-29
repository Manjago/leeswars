global turn = 0;

turn += 1;
debug("==== Turn " + turn);

var enemy = realEnemy()

debug("==== Prepare phase");
var bestWeapon = getBestWeapon(enemy);
if (bestWeapon != null)
    equipWeapon(bestWeapon);
else if (getWeapon() == null)
    equipWeapon(WEAPON_PISTOL);

debug("==== Movement phase");
tryMove(enemy);

debug("==== Action phase");
var shouldFlee = actionLoop(enemy)

debug("==== Flee phase");
tryFlee(enemy, shouldFlee)

debug(getOperations() + " operations");


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

function tryMove(enemy) {
    moveToward(enemy)
}

function inWeaponRange(enemy, weapon) {
    var me = getCell();
    var them = getCell(enemy);
    return lineOfSight(me, them)
        && getCellDistance(me, them) <= getWeaponMaxRange(weapon);
}

function getBestWeapon(enemy) {
    var weapons = getWeapons();
    var best = null;
    var bestDamage = 0;
    var bestTurns = 0;

    var tp = getTP();

    var me = getCell();
    var them = getCell(enemy);

    for (var i = 0; i < count(weapons); i++) {
        var cur = weapons[i];

        // check if we can fire this weapon now
        if (isInlineWeapon(cur) && !isOnSameLine(me, them))
            continue;
        // check line of sight
        if (weaponNeedLos(cur) && !lineOfSight(me, them))
            continue;
        // check range
        if (getCellDistance(me, them) > getWeaponMaxRange(cur))
            continue;

        // calculate the damage for this weapon
        var damage = getWeaponAverageDamage(cur); // [type, min, max, ...]
        var switchCost = (getWeapon() == cur ? 0 : 1); // cost for switch
        var turns = floor((tp - switchCost) / getWeaponCost(cur));

        damage *= turns;

        debug(getWeaponName(cur) + " would deal " + damage + " damage for " + turns + " turns");
        if (damage > bestDamage) {
            bestDamage = damage;
            bestTurns = turns;
            best = cur;
        }
    }

    debug("BEST: " + getWeaponName(best) + ", with " + bestDamage + " average for " + bestTurns + " turns");

    return best;
}

function getWeaponAverageDamage(weapon) {
    var effect = getDamageEffect(weapon);
    return (effect[1] + effect[2]) / 2;
}

function getDamageEffect(weapon) {
    // [type, min, max, turns, targets]
    var effects = getWeaponEffects(weapon);

    for (var i = 0; i < count(effects); i++)
        if (effects[i][0] == EFFECT_DAMAGE)
            return effects[i];

    return null;
}

function equipWeapon(weapon) {
    if (getWeapon() != weapon) {
        debug("WEAPON: " + getWeaponName(weapon));
        setWeapon(weapon);
    }
}

function actionLoop(enemy) {
    var didSomething = true;
    var shouldFlee = false;
    while (getTP() > 0 && didSomething) {
        didSomething = false;

        var life = getLife() / getTotalLife();
        debug("Life left: " + life);
        var enemyLife = getLife(enemy);
        var enemyLifeRatio = getLife() / (enemyLife == 0 ? 1 : enemyLife);
        debug("Enemy life ratio: " + enemyLifeRatio);
        if (life < 0.30 && enemyLifeRatio < 0.75) // I am a risk taker
        {
            didSomething = heal();
            shouldFlee = true;
        }

        if (!didSomething) // I am a brain eater
            didSomething = attack(enemy);

        if (didSomething) // I am very danger
            shouldFlee = false;
    }
    return shouldFlee
}

function attack(enemy) {
    debug(" > ATTACK");
    return useWeapon(enemy) == USE_SUCCESS
        || useChip(CHIP_SPARK, enemy) == USE_SUCCESS;
}

function heal() {
    debug(" > HEAL");
    return useChip(CHIP_BANDAGE) == USE_SUCCESS;
}

function tryFlee(enemy, shouldFlee) {
    var mpUsed = 1;
    while (getMP() > 0 && mpUsed > 0) {
        mpUsed = 0;

        var enemyDist = getCellDistance(getCell(), getCell(enemy)) + getMP(enemy);
        debug("Enemy weapon range: " + getWeaponMaxRange(getWeapon(enemy)));
        debug("Cell distance to enemy: " + (enemyDist - getMP(enemy)));
        debug("Safe distance: " + enemyDist);
        debug("Distance to enemy: " + getDistance(getCell(), getCell(enemy)));
        debug("In range to shoot: " + inWeaponRange(enemy, getWeapon()));

        // Run away
        if (shouldFlee)
            mpUsed = moveAwayFrom(enemy);

        // Attempt to counter weapons with min range
        if ((getWeaponMinRange(getWeapon(enemy)) > 1
            && getWeaponMinRange(getWeapon(enemy)) > enemyDist))
            mpUsed = moveToward(enemy, 1);
        else if (getWeaponMaxRange(getWeapon(enemy)) < enemyDist)
            mpUsed = moveAwayFrom(enemy, 1);
        else
            mpUsed = moveAwayFrom(enemy); // Run

        // else
        // 	   moveToward(enemy, 1); // maybe not a good idea :(

        if (mpUsed > 0)
            debug(" > MOVE");
    }
}