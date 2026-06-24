// types.ts
import { _decorator, Color, Component, Graphics, instantiate, Node, Prefab, resources, Sprite, SpriteAtlas, SpriteFrame, UITransform, Vec2, Vec3 } from 'cc';

export type TileType = 0 | 1 | 2 | 3 | 4 ; // 0表示空，1-5表示不同颜色
export type Position = { row: number; col: number };
export class Tile{
    tileType:TileType
    node:Node
    constructor() {
        // 什么都没做
    }
};
export class AnimationData{
    node:Node
    originPos:Vec3
    direct:Vec3
    ftilePos:Position
    targetPos:Vec3
}
export class Animation{
    costTime:number=0
    duration:number=0.3
    data:AnimationData[]
    constructor() {
        // 什么都没做
    }
};
export interface IBoard {
  rows: number;
  cols: number;
  grid: Tile[][];
}

export interface IMatch {
  tiles: Position[];
  type: 'row' | 'col' | 'lShape' | 'tShape';
}