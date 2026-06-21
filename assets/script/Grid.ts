import { _decorator, Color, Component, EventTouch, Graphics, Input, instantiate, Node, Prefab, resources, Sprite, SpriteAtlas, SpriteFrame, UITransform, Vec2, Vec3 } from 'cc';
const { ccclass, property } = _decorator;
import{MatchEngine} from './MatchEngine'
import { Box } from './Box';
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
    start() {
        
        this.drawGrid();
        this.generateBox();
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

        // 获取触摸位置对应的格子
        // const location = event.getUILocation();
        // const pos = this.getGridPosition(location.x, location.y);
        // if (!pos) return;

        // this.isDragging = true;
        // this.startPos.set(location.x, location.y);
        
        // this.engine.onTileTouchStart(pos.row, pos.col);
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
        
    }
}


