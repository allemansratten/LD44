import {Player} from "../Player"
import {Monster} from "./Monster"
import {Level} from "../../Level"
import {clamp} from "../../Util"
import {Vector} from "vector2d"
import {Shot} from "../Shot"

export class Ladybug extends Monster {

    private static readonly RADIUS = 28
    private static readonly MAX_SPEED = 70
    private static readonly ACCELERATION = 1000
    private static readonly DEACCELERATION = 500
    private static readonly HP = 10
    private static readonly SHOT_PREP_TIME = 0.5
    private static readonly SHOOTING_FREQ = 0.3
    private static readonly N_SHOTS = 7
    private static readonly SHOT_SPEED = 300
    private timeSinceLastShot: number = Math.random() * 1 / Ladybug.SHOOTING_FREQ
    private timeSinceShotPrep: number = 0

    speed: Vector = new Vector(0, 0)

    constructor(player: Player, pos: Vector) {
        super(player, pos, Ladybug.RADIUS, Ladybug.HP)
    }

    aliveDraw(context: CanvasRenderingContext2D): void {
        context.fillStyle = "#b22"
        context.beginPath()
        context.arc(this.pos.x, this.pos.y, this.r, 0, 2 * Math.PI)
        context.fill()
        context.beginPath()
        context.fillStyle = "#222"
        context.arc(this.pos.x, this.pos.y, this.r * 0.2, 0, 2 * Math.PI)
        context.fill()
    }

    aliveStep(seconds: number, level: Level) {
        this.timeSinceLastShot += seconds
        if (this.timeSinceShotPrep === 0) {
            let direction: Vector = this.player.pos.clone().subtract(this.pos) as Vector
            if (direction.length() !== 0 && this.timeSinceShotPrep === 0) {
                direction.normalise().mulS(Ladybug.ACCELERATION * seconds)
            }
            this.speed.add(direction)
        }

        const length2 = clamp(this.speed.magnitude() - Ladybug.DEACCELERATION * seconds, 0, Ladybug.MAX_SPEED)
        if (this.speed.length() > 1e-6) {
            this.speed = this.speed.normalise().mulS(length2)
        } else {
            // Avoid division by zero
            this.speed.setAxes(0, 0)
        }

        if (this.timeSinceShotPrep > 0) {
            this.timeSinceShotPrep += seconds
            if (this.timeSinceShotPrep > Ladybug.SHOT_PREP_TIME) {
                this.shoot()
                this.timeSinceShotPrep = 0
                this.timeSinceLastShot = 0
            }
        } else if (this.timeSinceLastShot > 1 / Ladybug.SHOOTING_FREQ) {
            this.timeSinceShotPrep = seconds
        }

        this.pos.add(this.speed.clone().mulS(seconds))
        this.resolveLevelCollision(level, this.speed)
    }

    private shoot() {
        const angle0 = this.angleToPlayer()
        for (let i = 0; i < Ladybug.N_SHOTS; i++) {
            const angle = angle0 + Math.PI * 2 / Ladybug.N_SHOTS * i

            this.createdEntities.push(
                new Shot(
                    this.player,
                    this.pos,
                    new Vector(Math.cos(angle), Math.sin(angle)),
                    false,
                    Ladybug.SHOT_SPEED
                )
            )
        }
    }
}