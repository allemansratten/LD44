import {Level} from "../Level"
import {Entity} from "./Entity"
import {Ant} from "./monster/Ant"
import {Worm} from "./monster/Worm"
import {Wasp} from "./monster/Wasp"
import {Fly} from "./monster/Fly"
import {StagBeetle} from "./monster/StagBeetle"
import {Vector} from "vector2d"
import {Player} from "./Player"

export class MonsterGenerator {
    private static readonly FIRST_LEVEL_MONSTERS = 5
    private static readonly LEVEL_MONSTERS_INCREMENT = 2
    private static readonly LEVEL_MONSTERS = [
        [Ant],
        [Ant, Fly],
        [Ant, Fly, StagBeetle],
        [Ant, Fly, StagBeetle, Wasp],
        [Ant, Fly, StagBeetle, Wasp, Worm],
    ]

    static generateMonsters(level: Level, player: Player): Entity[] {
        const entities: Entity[] = []
        for (let i = 0; i < MonsterGenerator.FIRST_LEVEL_MONSTERS + MonsterGenerator.LEVEL_MONSTERS_INCREMENT * (level.levelNum - 1); i++) {
            entities.push(this.addMonsterRandom(level, player))
        }
        return entities
    }

    static randomMonsterType(level: Level) {
        const levelTypeIdx = Math.min(level.levelNum, MonsterGenerator.LEVEL_MONSTERS.length) - 1
        const types = MonsterGenerator.LEVEL_MONSTERS[levelTypeIdx]
        return types[Math.floor(Math.random() * types.length)]
    }

    static addMonsterRandom(level: Level, player: Player): Entity {
        const toAdd = new (this.randomMonsterType(level))(player, new Vector(0, 0))
        toAdd.pos = level.generateValidPos(toAdd.r)
        return toAdd
    }
}