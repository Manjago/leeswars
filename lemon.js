global turn = 0;

/*
 * Silly Lemon 0.0.3
 *
 * Problems
 * ===========================
 *  - AI makes distinction between movement && actions -- they are tied
 *      together! eg. only heal if safe from enemy
 *  - [16544138] AI uses too many chips, only use them to gain an advantage or in need
 *  - Might need to add TP to allow more actions...
 *  - Need to detect if the enemy attacks, if shielding && healing then
 *      they can easily create a draw
 *  - Balance offence/defence, gets killed even when it could easily end
 *      the fight because of chips
 *  - CHIP_FLASH is available, learn how to use it
 *  - [16525404] Strange movement
 *  - [16544153] Got stuck against a corner
 *  - [16544157] Don't attack if will deal no damage, do something else
 *  - [16544430] Don't heal if you can end a fight with your attacks
 *  - AI moves too close sometimes, only move required amount to perform an action
 * 
 * Works well against
 * ===========================
 *  - Burn 'n run
 *  - Run in && shoot
 * 
 * Changelog
 * ===========================
 * 0.0.3 / 23-03-2016
 *  + Now supports multiple weapons, added best weapon function
 *  + Leek now has a chip preference order, but doesn't know which chips it has
 *  = Now attempting to move after switching weapons
 *  - Temporarily removing CHIP_HEAL, it's barely useful
 *  = Change life ratio from 0.3 to 0.75, assuming better heals
 *
 * Ideas
 * ===========================
 * EASY
 *  - Take into account enemy weapons (memorize them)
 *  - Try to move away in priority (we can always move towards later)
 *  - Taunt if we're winning (but don't waste action points)
 *  - Function to check if we're safe (take into acount enemy movement)
 *  - Function to check in how many MP the enemy is reachable
 * MEDIUM
 *  - Balance heals/attacks (right now we heal if we're low or critical)
 *  - Sort weapons based on damage/cost ratio
 * HARD
 *  - Build a tree of possible actions to decide best damage throughoutput
 *    - Get all possible actions in an array, sorted by highest damage
 *    - Get the first elements of the array to construct our action list
 * EXTREME
 *  - Terrain awareness, use objects to our advantage
 *  - Monte Carlo with known chips/weapons :D/
 */


turn += 1;
debug("==== Turn " + turn);

function tryMove(enemy)
{
	var mpUsed = 1;
	while (getMP() > 0
			&& !inWeaponRange(enemy, getWeapon())
			&& mpUsed > 0)
	{
		debug("In range: " + inWeaponRange(enemy, getWeapon()));
		mpUsed = moveToward(enemy, 1);
		debug(" > MOVE");
	}
}

function getWeaponAverageDamage(weapon)
{
	var effect = getDamageEffect(weapon);
	return (effect[1] + effect[2]) / 2;
}

function getDamageEffect(weapon)
{
	// [type, min, max, turns, targets]
	var effects = getWeaponEffects(weapon);
	
	for (var i = 0; i < count(effects); i++)
		if (effects[i][0] == EFFECT_DAMAGE)
			return effects[i];
	
	return null;
}

function getBestWeapon(enemy)
{
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
		var switch = (getWeapon() == cur ? 0 : 1); // cost for switch
		var turns = floor((tp - switch) / getWeaponCost(cur));
		
		damage *= turns;
		
		debug(getWeaponName(cur) + " would deal " + damage + " damage for " + turns + " turns");
		if (damage > bestDamage)
		{
			bestDamage = damage;
			bestTurns = turns;
			best = cur;
		}
	}
	
	debug("BEST: " + getWeaponName(best) + ", with " + bestDamage + " average for " + bestTurns + " turns");

	return best;
}

function equipWeapon(weapon)
{
	if (getWeapon() != weapon)
	{
		debug("WEAPON: " + getWeaponName(weapon));
		setWeapon(weapon);
	}
}

function tryChip(chip)
{
	var result = useChip(chip, getLeek());
	if(result == USE_SUCCESS)
		debug(" > " + getChipName(chip));
	return result;
}

function attack(enemy)
{
	// TODO: Learn how to use other chips
	debug(" > ATTACK");
	return useWeapon(enemy) == USE_SUCCESS
		or useChip(CHIP_SPARK, enemy) == USE_SUCCESS;
}

function heal()
{
	debug(" > HEAL");
	return useChip(CHIP_CURE, getLeek()) == USE_SUCCESS;
		// or useChip(CHIP_BANDAGE, getLeek()) == USE_SUCCESS;
}

function isSafe()
{
	//TODO: Safe
	// distance > enemyMaxAttackDistance + enemyMovement
}

function inWeaponRange(enemy, weapon)
{
	var me = getCell();
	var them = getCell(enemy);
	return lineOfSight(me, them)
		&& getCellDistance(me, them) <= getWeaponMaxRange(weapon);
}

// Fun message
if (turn == 1)
	say("Bonne chance :D");

// Self chips (only use one)
var chipOrder = [CHIP_HELMET, CHIP_SHIELD, CHIP_WALL];

for (var i = 0; i < count(chipOrder); i++)
	if (tryChip(chipOrder[i]) == USE_SUCCESS)
		break;

// Get our enemy
var enemy = getNearestEnemy();

// Move in 1 increments
debug("==== Movement phase");
tryMove(enemy);

// Try to shoot 'em up!
debug("==== Action phase");

// Attempt to equip a weapon
var bestWeapon = getBestWeapon(enemy); 
if (bestWeapon != null)
	equipWeapon(bestWeapon);
else if(getWeapon() == null)
	equipWeapon(WEAPON_PISTOL);
	
// try to move again
tryMove(enemy);
	
// ACTION
var didSomething = true;
var shouldFlee = false;
while (getTP() > 0 && didSomething)
{
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

// Useful, I know. You'll thank me later!
if (getLife(enemy) == 0)
{
	say("C'??tait amusant!");
	return;
}

// Get cell to move to
debug("==== Flee phase");
var mpUsed = 1;
while (getMP() > 0 && mpUsed > 0)
{
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
	else if (getChipMaxRange(CHIP_SPARK) < enemyDist)
		mpUsed = moveAwayFrom(enemy, 1);
	else
		mpUsed = moveAwayFrom(enemy); // Run
		
	// else
	// 	   moveToward(enemy, 1); // maybe not a good idea :(
	
	if (mpUsed > 0)
		debug(" > MOVE");
}

if (getLife(enemy) <= 5)
{
	say("T'en a de la chance toi... " + getLife(enemy) + " PV serieux >->;;");
}

debug(getOperations() + " operations");
