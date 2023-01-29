global turn = 0;

turn += 1;
debug("==== Turn " + turn);

var enemy = realEnemy() 

debug("==== Movement phase");
tryMove(enemy);

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
