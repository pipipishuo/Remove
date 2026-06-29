// types.ts
import { _decorator, Color, Component, Graphics, instantiate, Node, Prefab, resources, Sprite, SpriteAtlas, SpriteFrame, UITransform, Vec2, Vec3 } from 'cc';

export type TileType = 0 | 1 | 2 | 3 | 4 ; // 0表示空，1-5表示不同颜色
export type Position = { row: number; col: number };
export class Tile{
    tileType:TileType
    node:Node=null
    constructor() {
        // 什么都没做
    }
};
export enum AnimationType{
    Normal,
    firstPress,
    animation
}
export interface AnimationData{
    costTime:number
    duration:number
    setTime(costTime,duration);
    process();
    done();
    isOver():boolean;
}
export class Move implements AnimationData{
    costTime:number
    duration:number
    node:Node
    originPos:Vec3
    direct:Vec3
    len:number
    ftilePos:Position
    isOver(): boolean {
        if(this.costTime>this.duration){
            return true;        
        }else{
            return false;
        }
    }
    setData(node:Node,position:Vec3,ftilePos:Position){
        this.node=node;
        this.originPos=position.clone();
        this.ftilePos=ftilePos;
    }
    setDirect(direct:Vec3,len:number){
        this.len=len;
        this.direct=direct;
    }
    setTime(costTime,duration){
        this.costTime=costTime;
        this.duration=duration;
    }
    process(){
        const pos=this.node.getPosition();
        if(pos.y>1280){
            this.node.active = false;
        }else{
            this.node.active = true;
        }
        let opos=this.originPos;
        let len=this.len;
        let direct=this.direct;
        let rate=this.costTime/this.duration
        //let len=Math.sqrt(Math.pow(opos.x-tpos.x,2)+Math.pow(opos.y-tpos.y,2));
        
        this.node.setPosition(new Vec3(opos.x+direct.x*rate*len,opos.y+direct.y*rate*len,0));
    }
    done(){
        let opos=this.originPos;
        let len=this.len;
        let direct=this.direct;
        this.node.setPosition(new Vec3(opos.x+direct.x*len,opos.y+direct.y*len,0));
    }
}
export class Remove implements AnimationData{
    costTime:number
    duration:number
    node:Node
    first:boolean=true;
    isOver(): boolean {
        if(this.costTime>this.duration){
            return true;        
        }else{
            return false;
        }
        return !this.first;
    }
    setTime(costTime,duration){
        this.costTime=costTime;
        this.duration=duration;
    }
    process(){
        const sprite = this.node.getComponent(Sprite);
        sprite.color=new Color(255,125,125,125);
        this.first=false;
    }
    done(){
        this.node.destroy();
    }
}
export class Animation{
    costTime:number=0
    duration:number
    data:AnimationData[]
    constructor() {
        this.data=[];
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