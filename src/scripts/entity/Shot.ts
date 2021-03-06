import {Projectile} from "./Projectile"
import {Entity} from "./Entity"
import {Level} from "../Level"
import {Player} from "./Player"
import {Vector} from "vector2d"
import {BodyPart} from "./BodyPart"
import {Monster} from "./monster/Monster"
import {ImageManager} from "../ImageManager"

export class Shot extends Projectile {

    private static readonly RADIUS: number = 10
    private static readonly SPEED: number = 500
    private static readonly DURATION: number = 1 // How many seconds does the shot stay alive?
    alive: boolean = true
    public speed: Vector
    private duration: number

    constructor(protected player: Player, pos: Vector, dir: Vector, friendly: boolean, speed: number) {
        // super(pos, Shot.RADIUS, new CircleHitbox(Shot.RADIUS),
        super(player, pos.clone() as Vector, Shot.RADIUS, friendly)
        this.speed = dir.normalise().mulS(speed)
        this.duration = Shot.DURATION
    }

    collideWith(entity: Entity): void {
        if (entity.friendly !== this.friendly &&
            (entity instanceof Monster && (entity as Monster).alive()) ||
            (entity instanceof Player && (entity as Player).alive)) {
            this.alive = false
        }
    }

    step(seconds: number, level: Level): boolean {
        this.duration -= seconds
        if (this.duration <= 0) {
            this.alive = false
        }
        this.pos.add(this.speed.clone().mulS(seconds))
        if (this.resolveLevelCollision(level, this.speed)) this.alive = false
        return this.alive
    }

    draw(context: CanvasRenderingContext2D): void {
        super.draw(context)
        context.save()
        context.translate(this.pos.x, this.pos.y)
        const img = this.friendly ? ImageManager.get("shotplayer") : ImageManager.get("shotenemy")
        context.drawImage(img, 0, 0, img.width, img.height,
            -this.r, -this.r, this.r * 2, this.r * 2)
        context.restore()
    }
}