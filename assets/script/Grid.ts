import { _decorator, AudioSource, Color, Component, EventTouch, Graphics, Input, instantiate, Node, Prefab, resources, Sprite, SpriteAtlas, SpriteFrame, UITransform, Vec2, Vec3 } from 'cc';
const { ccclass, property } = _decorator;
import{MatchEngine} from './MatchEngine'
import { Box } from './Box';
import { Animation, AnimationData,Move,Position, Remove, Tile } from './types';
enum State{
    Normal,
    firstPress,
    animation
}
@ccclass('Grid')
export class Grid extends Component {
     @property(AudioSource)
    public audioSource: AudioSource = null!;
    atlasPath: string = 'ui/img'; // 必须是字符串路径
    spriteName: string = 'img3'; // 要获取的图片名称
    row:number=0;
    col:number=0;
    gridSize: number = 120; // 每个格子的尺寸
    @property(Prefab)
    gridPrefab: Prefab = null; // 在编辑器中拖入预制体
    engine:MatchEngine=null;
    animationQueue:Animation[];
    curAnimation:Animation=null;
    state:State=State.Normal;
    firstTile:Tile;
    secondTile:Tile;
    recordAnimation:Animation=null;
    exchangeDuration:number=0.3
    downDuration:number=0.6
    
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
    private checkMatch(){
       const matches = this.engine.findAllMatches();
       if(matches.length==0)return;
       this.audioSource.play();
       this.state=State.animation
        console.log("remove")
        let remove=new Animation;
        remove.duration=0.3;
        for(let i=0;i<matches.length;i++){
            for(let j=0;j<matches[i].tiles.length;j++){
                let pos=matches[i].tiles[j];
                let temp= new Remove;
                temp.node=this.engine.grid[pos.row][pos.col].node;
                remove.data.push(temp);
            }
        }
        this.animationQueue.push(remove);
        console.log("down")
        let down=new Animation;
        down.duration=this.downDuration;
        this.engine.removeMatches(matches); 
        //此时待消除方块已被标记为0
        for(let i=0;i<this.col;i++){
            let len=0;
            for(let j=0;j<this.row;j++){
                if(this.engine.grid[j][i].tileType==0){
                    len++;
                }else{
                    if(len!=0){
                        console.log("len",len,len*this.gridSize);
                        let move= new Move;
                        let tile=this.engine.grid[j][i];
                        move.setData(tile.node,tile.node.position,{row:j,col:i});
                        let direct=new Vec3(0,-1,0);
                        move.setDirect(direct,len*this.gridSize);
                        down.data.push(move);
                    }
                }
                
            }

            
            //落下来
            let writeRow = 0; // 从最顶部开始（row=0）
            // 从顶部向下遍历
            for (let r = 0; r < this.row; r++) { // 
                if (this.engine.grid[r][i].tileType !== 0) {
                    if (r !== writeRow) {
                        // 把方块移到上面的位置
                        this.engine.grid[writeRow][i].tileType = this.engine.grid[r][i].tileType ;
                        this.engine.grid[writeRow][i].node = this.engine.grid[r][i].node ;
                        this.engine.grid[r][i].tileType = 0;
                        
                    }
                    writeRow++; // 目标位置向下移动
                }
            }


            for (let r = writeRow; r < this.row; r++) {
                let tile=this.engine.grid[r][i];
                tile.tileType = this.engine.getRandomTile();        //给掉完空出来的填上值
                tile.node= instantiate(this.gridPrefab);        //为他们赋予新节点
                console.log("top box y",(this.row+r-writeRow+0.5)*this.gridSize);
                tile.node.setPosition(new Vec3((i+0.5)*this.gridSize,(this.row+r-writeRow+0.5)*this.gridSize));     //注意这里  这里应该是从上面开始的
                tile.node.active=false;
                tile.node.parent = this.node;
                let spriteName="img"+tile.tileType;
                this.loadAtlas(this.atlasPath, spriteName,tile.node);   

                let move= new Move;
                move.setData(tile.node,tile.node.position,{row:r,col:i});
                let direct=new Vec3(0,-1,0);
                move.setDirect(direct,len*this.gridSize);
                down.data.push(move);

            }
        }
        this.animationQueue.push(down);
    }
    private selectNode(node:Node){
        //let node=pnode.children[0];
        let position=node.getPosition()
        node.setPosition(new Vec3(position.x,position.y+6,position.z));
        // let graphic=node.getComponent(Graphics);
        // if(!graphic)return;
        // graphic.lineWidth = 4;
        // graphic.strokeColor = new Color(255, 0, 0, 255); // 半透明白色
        // graphic.moveTo(0, 0);
        // graphic.lineTo(25, 25);
        // graphic.stroke();
    }
    private unselectNode(node:Node){
        //let node=pnode.children[0];
        let position=node.getPosition()
        node.setPosition(new Vec3(position.x,position.y-6,position.z));
        // let graphic=node.getComponent(Graphics);
        // if(!graphic)return;
        // graphic.lineWidth = 4;
        // graphic.strokeColor = new Color(255, 0, 0, 255); // 半透明白色
        // graphic.moveTo(0, 0);
        // graphic.lineTo(25, 25);
        // graphic.stroke();
    }
    private onTouchStart(event: EventTouch) {
        if (!this.engine) return;
        
        const selfPos = this.node.worldPosition;
         
        
        // 获取触摸位置对应的格子
        const location = event.getUILocation();
        const pos = this.getGridPosition(location.x-selfPos.x, location.y-selfPos.y);
        
        if (!pos) return;
        
       
        
        switch (this.state){
            case State.Normal:{
                this.recordAnimation=new Animation;
                this.recordAnimation.duration=this.exchangeDuration;
                let tile=this.engine.grid[pos.row][pos.col];
                let animationData=new Move;
                
                animationData.setData(tile.node,tile.node.position,pos)
                
                this.recordAnimation.data.push(animationData);
                this.state=State.firstPress;

                this.selectNode(tile.node);
                break;
            }
            case State.firstPress:{
                let tile=this.engine.grid[pos.row][pos.col];
                let dPos=new Vec3(tile.node.position.x,tile.node.position.y,0);
                let out=new Vec3();
                let first=this.recordAnimation.data[0] as Move;
                out.y=pos.row-first.ftilePos.row
                out.x=pos.col-first.ftilePos.col
                this.unselectNode(first.node);
                console.log("direct",out.x,out.y)
                
                if((out.x==1&&out.y==0)||(out.x==-1&&out.y==0)||(out.x==0&&out.y==1)||(out.x==0&&out.y==-1)){
                    let second=new Move;
                    second.setData(tile.node,tile.node.position,pos);
                   

                    
                    
                    let len=Math.sqrt(Math.pow(dPos.x-first.node.position.x,2)+Math.pow(dPos.y-first.node.position.y,2));;
                    
                    
                    first.setDirect(out.clone(),len);
                    second.setDirect(out.clone().multiplyScalar(-1),len);
                    this.recordAnimation.data.push(second);
                    this.animationQueue.push(this.recordAnimation);
                    console.log(first.ftilePos,second.ftilePos)
                    if(this.engine.swap(first.ftilePos,second.ftilePos)){
                        //this.checkMatch();
                    }else{

                        //不能交换的话就得复归原位
                        this.recordAnimation=new Animation;
                        this.recordAnimation.duration=this.exchangeDuration;
                        let temp= new Move;
                        
                        temp.setData(first.node,second.node.position,first.ftilePos)
                        temp.setDirect(out.clone().multiplyScalar(-1),len);

                        this.recordAnimation.data.push(temp);
                        temp= new Move;
                       
                        temp.setData(second.node,first.node.position,second.ftilePos)
                        temp.setDirect(out.clone(),len);

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

            //console.log('✅ 图集加载成功:', atlas);

            // 2. 从图集中获取 SpriteFrame
            const spriteFrame = atlas.getSpriteFrame(spriteName);
            if (!spriteFrame) {
                console.error(`❌ 图集中找不到名为 "${spriteName}" 的图片`);
                // 打印所有可用的图片名称，方便调试
                //this.logAllSpriteNames(atlas);
                return;
            }

            //console.log(`✅ 成功获取 SpriteFrame: ${spriteName}`);

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
        //console.log('✅ 图片显示成功');
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
        return;
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
                if(animationData.isOver()){
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
        }else{
            this.checkMatch();
        }
        
    }
}


