class mapPosition
{
    constructor(newx, newz)
    {
        this.x = newx;
        this.z = newz;
    }
}

class Mob
{
    constructor()
    {
        this.mesh = undefined;
        this.hp = 10;
        this.speed = 2;
        this.currentStep = 1;
        this.target = undefined; // instance of mapPosition
        this.readyForNextStep = false;
    }
}

class MobsManager
{
    constructor()
    {
        this.mobArray = new Array();
        this.pathTargets = new Array();
    }
}