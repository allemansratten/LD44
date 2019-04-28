import {Drawable} from "../Drawable"
import {Vector} from "vector2d"
import {BodyPart} from "./BodyPart"
import {CircleHitbox} from "./CircleHitbox"
import {ImageManager} from "../ImageManager"

export class Eye extends BodyPart implements Drawable {

    private blinkingState: number = -1
    private blinkingStartTime: number
    private blinkingSinePrev: number
    private blinkingLastTime: number = 0

    private static readonly WHITE_COLOR = "#888888"
    private static readonly IRIS_COLOR = "#222222"
    private static readonly EYELID_COLOR = "#6d371e"
    private static readonly BLINKING_INTERVAL = 800
    private static readonly BLINKING_DURATION = 300

    constructor(pos: Vector, r: number) {
        super(pos, r, new CircleHitbox(r))
        this.blinkingLastTime = Date.now()
    }

    static randomEyeSize(): number {
        return 10 + (Math.random() - 0.5) * 2.5
    }

    draw(context: CanvasRenderingContext2D): void {
        // let time = Date.now()
        //
        // context.fillStyle = Eye.WHITE_COLOR
        // context.beginPath()
        // context.arc(this.pos.x, this.pos.y, this.r, 0, 2 * Math.PI)
        // context.fill()
        // context.fillStyle = Eye.IRIS_COLOR
        //
        // context.beginPath()
        // context.arc(this.pos.x, this.pos.y, this.r / 2, 0, 2 * Math.PI)
        // context.closePath()
        // context.fill()
        //
        // // roll dice to start blinking
        // if (this.blinkingState == -1) {
        //     // this is so that the probs wouldn't be frame dependent
        //     if (Math.random() > 1 - this.blinkingLastTime / time / Eye.BLINKING_INTERVAL) {
        //         this.blinkingState = 0
        //         this.blinkingSinePrev = 0
        //         this.blinkingStartTime = this.blinkingLastTime = Date.now()
        //     }
        // } else {
        //     let blinkSine = Math.sin((this.blinkingStartTime - time) / Eye.BLINKING_DURATION)
        //     context.beginPath()
        //     // context.arc(this.pos.x, this.pos.y, this.r, 0, Math.PI * (1-blinkSine))
        //     context.ellipse(this.pos.x, this.pos.y, this.r, (1 + blinkSine) * this.r, 0, 0, 2 * Math.PI)
        //     context.fill()
        //     context.fillStyle = Eye.EYELID_COLOR
        //     if (this.blinkingState == 0 && blinkSine <= this.blinkingSinePrev) {
        //         this.blinkingState = 1
        //     }
        //     if (this.blinkingState == 1 && blinkSine >= this.blinkingSinePrev) {
        //         this.blinkingState = -1
        //     }
        //     this.blinkingSinePrev = blinkSine
        // }

        const img = ImageManager.get("eye1")
        context.drawImage(img, 0, 0, img.width, img.height,
            this.pos.x - this.r, this.pos.y - this.r, this.r * 2, this.r * 2)
    }
}
