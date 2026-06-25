import { _decorator, Color, Component, EventTouch, Graphics, Input, instantiate, Node, Prefab, resources, Sprite, SpriteAtlas, SpriteFrame, UITransform, Vec2, Vec3 } from 'cc';
const { ccclass, property } = _decorator;
import{MatchEngine} from './MatchEngine'
import { Box } from './Box';
import { Animation, AnimationData,Exchang,Position, Remove, Tile } from './types';
enum State{
    Normal,
    firstPress,
    animation
}
@ccclass('Grid')
export class Grid extends Component {
    atlasPath: string = 'ui/img'; // 必须是字符串路径
    spriteName: string = 'img3'; // 要获取的图片名称
    row:number=0;
    col:number=0;
    gridSize: number = 50; // 每个格子的尺寸
    @property(Prefab)
    gridPrefab: Prefab = null; // 在编辑器中拖入预制体
    engine:MatchEngine=null;
    animationQueue:Animation[];
    curAnimation:Animation=null;
    state:State=State.Normal;
    firstTile:Tile;
    secondTile:Tile;
    recordAnimation:Animation=null;
    start() {
        this.animationQueue = [];
        this.drawGrid();
        this.generateBox();
        this.registerTouchEvents();
    }
    private registerTouchEvents() {
        // Cocos Creator 触摸事件
        this.node.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        // this.node.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        // this.node.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        // this.node.on(Input.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    }
    
    private onTouchStart(event: EventTouch) {
        if (!this.engine) return;
        let worldPos = this.node.worldPosition;
        console.log("世界坐标: ", worldPos.x, worldPos.y, worldPos.z);
        // 获取触摸位置对应的格子
        const location = event.getUILocation();
        const pos = this.getGridPosition(location.x, location.y);
        if (!pos) return;
        console.log("对应坐标",pos.row,pos.col);
       
        
        switch (this.state){
            case State.Normal:{
                this.recordAnimation=new Animation;
                
                let tile=this.engine.grid[pos.row][pos.col];
                let animationData=new Exchang;
                animationData.setData(tile.node,pos)
                
                this.recordAnimation.data.push(animationData);
                this.state=State.firstPress;
                break;
            }
            case State.firstPress:{
                let tile=this.engine.grid[pos.row][pos.col];
                let dPos=new Vec3(tile.node.position.x,tile.node.position.y,0);
                let out=new Vec3();
                let first=this.recordAnimation.data[0] as Exchang;
                out.y=pos.row-first.ftilePos.row
                out.x=pos.col-first.ftilePos.col
                
                console.log("direct",out.x,out.y)
                
                if((out.x==1&&out.y==0)||(out.x==-1&&out.y==0)||(out.x==0&&out.y==1)||(out.x==0&&out.y==-1)){
                    let second=new Exchang;
                    second.setData(tile.node,pos);
                    

                    first.direct=out.clone();
                    second.direct=out.clone().multiplyScalar(-1);
                    
                    let len=Math.sqrt(Math.pow(dPos.x-first.node.position.x,2)+Math.pow(dPos.y-first.node.position.y,2));;
                    second.len=len;
                    first.len=len;

                    this.recordAnimation.data.push(second);
                    this.animationQueue.push(this.recordAnimation);
                    console.log(first.ftilePos,second.ftilePos)
                    if(this.engine.swap(first.ftilePos,second.ftilePos)){
                        console.log("match")
                        let animation=new Animation;
                        
                        const matches = this.engine.findAllMatches();
                        for(let i=0;i<matches.length;i++){
                            for(let j=0;j<matches[i].tiles.length;j++){
                                let pos=matches[i].tiles[j];
                                let temp= new Remove;
                                temp.node=this.engine.grid[pos.row][pos.col].node;
                                animation.data.push(temp);
                            }
                        }
                        this.animationQueue.push(animation);
                    }else{

                        //不能交换的话就得复归原位
                        this.recordAnimation=new Animation;
                        
                        let temp= new Exchang;
                        temp.setData(first.node,first.ftilePos)
                        temp.direct=out.clone();
                        temp.len=len;
                        

                        this.recordAnimation.data.push(temp);
                        temp= new Exchang;
                        temp.setData(second.node,second.ftilePos)
                        temp.direct=out.clone().multiplyScalar(-1);
                        temp.len=len;
                        this.recordAnimation.data.push(temp);
                        this.animationQueue.push(this.recordAnimation);
                    }
                    this.state=State.animation
                }else{
                    this.recordAnimation.data.length=0
                    this.recordAnimation=null
                    this.state=State.Normal
                }
                
                
                break;
            }
        }
        
       
        // this.isDragging = true;
        // this.startPos.set(location.x, location.y);
        
        // this.engine.onTileTouchStart(pos.row, pos.col);
    }
    getGridPosition(x:number,y:number):Position{
        let pos:Position={row:0,col:0};
        console.log("对应坐标",x,y);
        pos.row=Math.floor(y/this.gridSize);
        pos.col=Math.floor(x/this.gridSize);
        return pos;
    }
    generateBox(){
        this.engine=new MatchEngine(this.row,this.col);
         for (let x = 0; x <this.col; x ++ ) {
            for (let y = 0; y <this.row; y ++) {
                
                let tile=this.engine.grid[y][x];
                tile.node= instantiate(this.gridPrefab);
                tile.node.setPosition(new Vec3((x+0.5)*this.gridSize,(y+0.5)*this.gridSize));
                tile.node.parent = this.node;
                let spriteName="img"+tile.tileType;
                this.loadAtlas(this.atlasPath, spriteName,tile.node);
                
            }
        }

        
    }
    loadAtlas(atlasPath: string, spriteName: string,targetNode:Node) {
        // 1. 加载图集资源
        resources.load(atlasPath, SpriteAtlas, (err, atlas: SpriteAtlas) => {
            if (err) {
                console.error('❌ 加载图集失败:', err);
                console.error('请检查路径是否正确，图集文件是否在 resources 目录下');
                return;
            }

            console.log('✅ 图集加载成功:', atlas);

            // 2. 从图集中获取 SpriteFrame
            const spriteFrame = atlas.getSpriteFrame(spriteName);
            if (!spriteFrame) {
                console.error(`❌ 图集中找不到名为 "${spriteName}" 的图片`);
                // 打印所有可用的图片名称，方便调试
                //this.logAllSpriteNames(atlas);
                return;
            }

            console.log(`✅ 成功获取 SpriteFrame: ${spriteName}`);

            // 3. 显示到 Sprite 组件上
            this.applySpriteFrame(spriteFrame,targetNode);
        });
    }
    applySpriteFrame(spriteFrame: SpriteFrame,targetNode) {
        if (!targetNode) {
            console.error('❌ 未设置目标节点 targetNode');
            return;
        }

        const sprite = targetNode.getComponent(Sprite);
        if (!sprite) {
            console.error('❌ 目标节点没有 Sprite 组件，请先添加');
            return;
        }

        sprite.spriteFrame = spriteFrame;
         sprite.markForUpdateRenderData();
        console.log('✅ 图片显示成功');
    }
    drawGrid() {
        const graphics = this.getComponent(Graphics);
        if (!graphics) return;

        graphics.clear(); // 清除之前绘制的内容

        // 1. 获取绘制区域尺寸（例如屏幕尺寸）
        const uiTransform = this.getComponent(UITransform);
        const width = uiTransform.width/2;
        const height = uiTransform.height/2;
        const center = new Vec2(0, 0); // 假设节点中心在 (0,0)
        this.row=Math.floor(height/this.gridSize);
        this.col=Math.floor(width/this.gridSize);
        // 2. 设置线条样式
        graphics.lineWidth = 4;
        graphics.strokeColor = new Color(255, 0, 0, 255); // 半透明白色

        // 3. 绘制竖线
        // 从 ( -width/2 ) 到 ( width/2 ) 循环
        for (let x = 0; x <=this.col; x ++ ) {
            
            graphics.moveTo(x*this.gridSize, 0);
            graphics.lineTo(x*this.gridSize, height);
        }

        // 4. 绘制横线
        for (let y = 0; y <=this.row; y ++) {
            graphics.moveTo(0, y*this.gridSize);
            graphics.lineTo(width, y*this.gridSize);
        }
        graphics.moveTo(0, 0);
        graphics.lineTo( this.gridSize,  this.gridSize);
        graphics.stroke(); // 执行绘制
    }
    update(deltaTime: number) {
        if(this.state==State.animation){
            if(this.curAnimation==null){
                this.curAnimation=this.animationQueue.shift();
            }
            this.curAnimation.costTime=this.curAnimation.costTime+deltaTime;
            for(let i=0;i<this.curAnimation.data.length;i++){
                let animationData= this.curAnimation.data[i];
                animationData.setTime(this.curAnimation.costTime,this.curAnimation.duration)
                if(this.curAnimation.costTime>this.curAnimation.duration){
                    animationData.done();
                    continue;
                }else{
                    animationData.process();
                }
            }
            if(this.curAnimation.costTime>this.curAnimation.duration){
                this.curAnimation.costTime=0;
                this.curAnimation=null;
                if(this.animationQueue.length==0){
                    this.state=State.Normal
                }
            }
        }
        
    }
}


