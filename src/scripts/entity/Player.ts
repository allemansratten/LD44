import {Entity} from "./Entity"
import {DirectionKeyState} from "../DirectionKeyState"
import {Vector} from "vector2d"
import {Level} from "../Level"
import {CircleHitbox} from "./CircleHitbox"
import {Eye} from "./Eye"
import {Shot} from "./Shot"
import {clamp, interpolateLinear, Smoother} from "../Util"
import {Arm} from "./Arm"
import {Leg} from "./Leg"
import {Monster} from "./monster/Monster"
import {BodyPart} from "./BodyPart"
import {ImageManager} from "../ImageManager"

export class Player extends Entity {

    static readonly RADIUS = 32
    static readonly MAX_SPEED = 240 // px / s
    static readonly ZERO_LEGS_MAX_SPEED = 20 // px / s
    private static readonly ACCELERATION = 2000 // px / s^2
    private static readonly DECELERATION = 800
    private static readonly INVINCIBLE_AFTER_HIT_TIME = 1
    private static readonly SHOT_SPEED = 500
    private static readonly ZOOM_0_EYES = 5
    private static readonly ZOOM_1_EYE = 1.7
    private static readonly ZOOM_MAX_EYES = 0.6
    private static readonly SHOOTING_FREQ_1_ARM = 2
    private static readonly SHOOTING_FREQ_10_ARMS = 6
    // Cosmetics
    private static readonly ALIVE_COLOR = "#9e502c"
    private static readonly INVINCIBLE_COLOR = "#ff502c"
    private static readonly DEAD_COLOR = "#91a05b"
    private static readonly MOUTH_COLOR = "#512815"
    private static readonly MOUTH_RANGE = 0.8
    private static readonly HIT_THICC_MULTIPLIER = 8
    private static readonly BODY_PARTS_MAX = 10

    speed: Vector = new Vector(0, 0)

    movementKeyState: DirectionKeyState = new DirectionKeyState(
        ["w", "d", "s", "a"]
    )
    shootingKeyState: DirectionKeyState = new DirectionKeyState(
        ["arrowup", "arrowright", "arrowdown", "arrowleft"]
    )

    readonly friendly: boolean = true
    alive: boolean = true
    private shotCooldown: number = 0 // Time until next shot
    private invincibleTime: number = 0
    zoomSmoother: Smoother

    // hit animations
    private hitAnimStatus: number = -1
    private hitStartTime: number
    private hitSinePrev: number

    private eyes: Eye[] = []
    private arms: Arm[] = []
    private legs: Leg[] = []
    private activeArmIndex: number = 0

    childEyes = 0
    childLegs = 0
    childArms = 0

    constructor(pos: Vector, eyes: number, legs: number, arms: number) {
        super(pos, Player.RADIUS, new CircleHitbox((Player.RADIUS)))
        for (let i = 0; i < eyes; i++) {
            this.eyes.push(new Eye(pos, Eye.randomEyeSize()))
        }
        let armIndicies = [1, 2, 3, 4, 6, 7, 8, 9, 11, 12]
        for (let i = 0; i < arms; i++) {
            let index = Math.floor(Math.random() * armIndicies.length)
            let dir = armIndicies[index]
            armIndicies.splice(index, 1)
            this.arms.push(new Arm(pos, dir))
        }

        for (let i = 0; i < legs; i++) {
            this.legs.push(new Leg(pos))
        }
        this.zoomSmoother = new Smoother(this.getTargetZoom(), 1)
    }

    draw(context: CanvasRenderingContext2D): void {
        super.draw(context)
        let time = Date.now()
        // draw legs
        this.legs.forEach((leg, index) => {
            leg.speed = this.speed.length()
            if (index % 2 == 0) {
                leg.pos = new Vector(this.pos.x + this.r * Math.sin(index / this.legs.length) + 2, this.pos.y + this.r * Math.cos(index / this.legs.length))
                leg.rot = -index / this.legs.length * Math.PI / 2
            } else {
                leg.pos = new Vector(this.pos.x - this.r * Math.sin(index / this.legs.length) - 1, this.pos.y + this.r * Math.cos(index / this.legs.length))
                leg.rot = index / this.legs.length * Math.PI / 3
            }

            leg.draw(context)
        })


        // draw arms
        this.arms.forEach((arm, index) => {
            arm.pos = new Vector(this.pos.x - 40, this.pos.y + 5 * index)
            if (arm.defaultDir <= 6) {
                arm.pos = new Vector(this.pos.x + this.r * 1.22, this.pos.y + arm.defaultDir / 12 * 110 - 38)
            } else {
                arm.pos = new Vector(this.pos.x - this.r * 1.22, this.pos.y - arm.defaultDir / 12 * 100 + 76)
            }
            arm.draw(context)
        })


        // draw body
        context.fillStyle = this.invincibleTime > 0 ? Player.INVINCIBLE_COLOR : Player.ALIVE_COLOR
        context.beginPath()
        let curR = this.r
        if (this.hitAnimStatus !== -1) {
            let hitSine = Math.sin((this.hitStartTime - time) / 100)
            curR = this.r - hitSine * Player.HIT_THICC_MULTIPLIER
            if (this.hitAnimStatus == 0 && hitSine >= 0.9) {
                this.hitAnimStatus = 1
            }
            if (this.hitAnimStatus == 1 && hitSine <= 0.1) {
                this.hitAnimStatus = -1
            }
            this.hitSinePrev = hitSine
        }
        const img = ImageManager.get("paper1")
        context.drawImage(img, 0, 0, img.width, img.height,
            this.pos.x - curR, this.pos.y - curR, curR * 2, curR * 2)

        // draw eyes
        this.eyes.forEach((eye, index) => {
            if (this.eyes.length == 1) {
                eye.pos = new Vector(this.pos.x, this.pos.y - this.r / 2)
            } else {
                if (index >= 8 && index <= 9)
                    eye.pos = new Vector(this.pos.x + (8.5 - index) * this.r * 0.9, this.pos.y - this.r / 5.6)
                if (index >= 6 && index <= 7)
                    eye.pos = new Vector(this.pos.x + (6.5 - index) * this.r * 1.4, this.pos.y - this.r / 1.6)
                else if (index >= 4 && index <= 5)
                    eye.pos = new Vector(this.pos.x + (4.5 - index) * this.r * 1.6, this.pos.y - this.r / 3.5)
                else if (index >= 2 && index <= 3)
                    eye.pos = new Vector(this.pos.x, this.pos.y - this.r / 3 + (2 - index) * 13)
                else if (index >= 0 && index <= 1)
                    eye.pos = new Vector(this.pos.x + (-0.5 + index) * this.r * 0.7, this.pos.y - this.r / 2)
            }
            eye.draw(context)
        })

        // draw mouth
        context.fillStyle = Player.MOUTH_COLOR
        context.lineWidth = 3
        context.beginPath()
        let mouth_range_sine = Math.sin(time / 300) / 4
        if (this.invincibleTime <= 0) {
            context.arc(this.pos.x, this.pos.y,
                this.r / 2, Math.PI * (1 - Player.MOUTH_RANGE) + mouth_range_sine,
                Math.PI * Player.MOUTH_RANGE - mouth_range_sine
            )
        } else {
            context.arc(this.pos.x, this.pos.y + this.r / 1.5, this.r / 2,
                Math.PI + Math.PI * (1 - Player.MOUTH_RANGE),
                Math.PI + Math.PI * Player.MOUTH_RANGE
            )
        }

        context.stroke()


    }

    private stepMovement(seconds: number, level: Level) {
        // Acceleration
        let direction: Vector = this.movementKeyState.getDirection()
        const accel = Player.ACCELERATION * 0.75 + this.legs.length * 0.08 * Player.ACCELERATION
        if (direction.length() !== 0) {
            direction.normalise().mulS(accel * seconds)
        }

        this.speed.add(direction)
        // Deacceleration
        const maxSpeed = this.getMaxMovementSpeed()
        const length2 = clamp(this.speed.magnitude() - Player.DECELERATION * seconds, 0, maxSpeed)

        if (this.speed.length() > 1e-6) {
            this.speed = this.speed.normalise().mulS(length2)
        } else {
            // Avoid division by zero
            this.speed.setAxes(0, 0)
        }

        this.pos.add(this.speed.clone().mulS(seconds))
        this.resolveLevelCollision(level, this.speed)
    }

    private stepShooting(seconds: number) {
        let direction: Vector = this.shootingKeyState.getDirection()
        this.shotCooldown = Math.max(0, this.shotCooldown - seconds)
        if (this.shotCooldown === 0 && direction.length() !== 0 && this.arms.length > 0) {
            this.activeArmIndex = (this.activeArmIndex + 1) % this.arms.length
            let spawnPos = this.arms[this.activeArmIndex].getSpawnPoint()

            spawnPos.add(this.pos.clone().mulS(3))
            spawnPos.mulS(1 / 4)
            this.arms[this.activeArmIndex].doRecoil()
            this.createdEntities.push(new Shot(this, spawnPos, direction, true, Player.SHOT_SPEED))
            const shootingSpeed = this.getShootingSpeed()
            this.shotCooldown = 1 / shootingSpeed
        }
    }

    step(seconds: number, level: Level): boolean {
        this.invincibleTime = Math.max(0, this.invincibleTime - seconds)
        this.stepMovement(seconds, level)
        this.stepShooting(seconds)
        this.zoomSmoother.setTarget(this.getTargetZoom())
        this.zoomSmoother.step(seconds)
        return true
    }

    collideWith(entity: Entity): void {
        if (this.invincibleTime <= 0 && (entity instanceof Monster && (entity as Monster).alive()) || (entity instanceof Shot && (entity as Shot).alive)) {
            if (entity instanceof Shot) (entity as Shot).alive = false
            this.hitAnim()
            const partIndex = Math.floor(Math.random() * (this.eyes.length + this.arms.length + this.legs.length))
            if (partIndex < this.eyes.length) {
                this.eyes.pop()
            } else if (partIndex - this.eyes.length < this.arms.length) {
                this.arms.pop()
            } else {
                this.legs.pop()
            }
            this.invincibleTime = Player.INVINCIBLE_AFTER_HIT_TIME
        } else if (entity instanceof BodyPart) {
            if (entity instanceof Arm) {
                this.childArms = Math.min(Player.BODY_PARTS_MAX, this.childArms + 1)
            } else if (entity instanceof Leg) {
                this.childLegs = Math.min(Player.BODY_PARTS_MAX, this.childLegs + 1)
            } else {
                this.childEyes = Math.min(Player.BODY_PARTS_MAX, this.childEyes + 1)
            }
        }
        if (this.legs.length == 0 && this.arms.length == 0 && this.eyes.length == 0) this.alive = false
    }

    hitAnim(): void {
        this.hitStartTime = Date.now()
        this.hitAnimStatus = 0
        this.hitSinePrev = 0
    }

    private getTargetZoom(): number {
        if (this.eyes.length === 0) {
            return Player.ZOOM_0_EYES
        }
        const goodness = (this.eyes.length - 1) / 9
        return Math.exp(Math.log(Player.ZOOM_MAX_EYES) * goodness + Math.log(Player.ZOOM_1_EYE) * (1 - goodness))
        // return 1 / (1 + 0.05 * this.eyes.length)
    }

    public getZoom(): number {
        return this.zoomSmoother.get()
    }

    getMaxMovementSpeed(): number {
        if (this.legs.length == 0) {
            return Player.ZERO_LEGS_MAX_SPEED
        } else {
            return Player.MAX_SPEED * 0.75 + this.legs.length * 0.08 * Player.MAX_SPEED
        }
    }

    getShootingSpeed(): number {
        if (this.arms.length === 0) {
            return 0
        }
        const goodness = (this.arms.length - 1) / 9
        return Math.exp(Math.log(Player.SHOOTING_FREQ_10_ARMS) * goodness + Math.log(Player.SHOOTING_FREQ_1_ARM) * (1 - goodness))
    }
}
