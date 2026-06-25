// MatchEngine.ts
import { TileType,Tile, Position, IBoard, IMatch } from './types';

export class MatchEngine {
  private rows: number;
  private cols: number;
  grid: Tile[][];
  private tileTypes: TileType[] = [1, 2, 3, 4]; // 可用元素类型

  constructor(rows: number = 8, cols: number = 8) {
    this.rows = rows;
    this.cols = cols;
    this.grid = [];
    this.initBoard();
    
  }
    
  /**
   * 初始化棋盘，确保没有初始三消
   */
  private initBoard(): void {
    this.grid = [];
    for (let r = 0; r < this.rows; r++) {
      this.grid[r] = [];
      for (let c = 0; c < this.cols; c++) {
        let tile=new Tile;
        let attempts = 0;
        do {
          tile.tileType = this.getRandomTile();
          attempts++;
          // 防止死循环
          if (attempts > 100) break;
        } while (this.wouldMatch(r, c, tile.tileType));
        this.grid[r][c] = tile;
      }
    }
  }

  /**
   * 获取随机元素
   */
  private getRandomTile(): TileType {
    const index = Math.floor(Math.random() * this.tileTypes.length);
    return this.tileTypes[index];
  }

  /**
   * 检查在位置(row, col)放置tile是否会形成三消
   */
  private wouldMatch(row: number, col: number, tile: TileType): boolean {
    // 检查水平方向（左边两个）
    if (col >= 2) {
      if (this.grid[row][col - 1].tileType === tile && this.grid[row][col - 2].tileType === tile) {
        return true;
      }
    }
    // 检查垂直方向（上边两个）
    if (row >= 2) {
      if (this.grid[row - 1] && this.grid[row - 1][col].tileType === tile && 
          this.grid[row - 2] && this.grid[row - 2][col].tileType === tile) {
        return true;
      }
    }
    return false;
  }

  /**
   * 交换两个位置，返回是否成功
   */
  public swap(pos1: Position, pos2: Position): boolean {
    // 检查是否相邻
    const rowDiff = Math.abs(pos1.row - pos2.row);
    const colDiff = Math.abs(pos1.col - pos2.col);
    if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
      // 执行交换
      const temp = this.grid[pos1.row][pos1.col];
      this.grid[pos1.row][pos1.col] = this.grid[pos2.row][pos2.col];
      this.grid[pos2.row][pos2.col] = temp;

      // 检查交换后是否有匹配
      const matches = this.findAllMatches();
      if (matches.length > 0) {
        return true;
      } else {
        // 没有匹配，交换回来
        const tempBack = this.grid[pos1.row][pos1.col];
        this.grid[pos1.row][pos1.col] = this.grid[pos2.row][pos2.col];
        this.grid[pos2.row][pos2.col] = tempBack;
        return false;
      }
    }
    return false;
  }

  /**
   * 查找所有三消匹配
   */
  public findAllMatches(): IMatch[] {
    const matches: IMatch[] = [];
    const visited = new Set<string>();

    // 水平匹配
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols - 2; c++) {
        const tile = this.grid[r][c];
        if (tile.tileType === 0) continue;
        if (this.grid[r][c + 1].tileType === tile.tileType && this.grid[r][c + 2].tileType === tile.tileType) {
          const match: Position[] = [];
          let end = c + 2;
          while (end + 1 < this.cols && this.grid[r][end + 1].tileType === tile.tileType) {
            end++;
          }
          for (let i = c; i <= end; i++) {
            const key = `${r},${i}`;
            if (!visited.has(key)) {
              match.push({ row: r, col: i });
              visited.add(key);
            }
          }
          if (match.length >= 3) {
            matches.push({ tiles: match, type: 'row' });
          }
        }
      }
    }

    // 垂直匹配
    for (let c = 0; c < this.cols; c++) {
      for (let r = 0; r < this.rows - 2; r++) {
        const tile = this.grid[r][c];
        if (tile.tileType === 0) continue;
        if (this.grid[r + 1][c].tileType === tile.tileType && this.grid[r + 2][c].tileType === tile.tileType) {
          const match: Position[] = [];
          let end = r + 2;
          while (end + 1 < this.rows && this.grid[end + 1][c].tileType === tile.tileType) {
            end++;
          }
          for (let i = r; i <= end; i++) {
            const key = `${i},${c}`;
            if (!visited.has(key)) {
              match.push({ row: i, col: c });
              visited.add(key);
            }
          }
          if (match.length >= 3) {
            matches.push({ tiles: match, type: 'col' });
          }
        }
      }
    }

    return matches;
  }

  /**
   * 移除所有匹配的元素（标记为0）
   */
  public removeMatches(matches: IMatch[]): number {
    let removed = 0;
    for (const match of matches) {
      for (const pos of match.tiles) {
        if (this.grid[pos.row][pos.col].tileType !== 0) {
          this.grid[pos.row][pos.col].tileType = 0;
          removed++;
        }
      }
    }
    return removed;
  }

  /**
   * 重力掉落：让元素下落填补空位
   */
  public dropDown(): boolean {
    let dropped = false;
    for (let c = 0; c < this.cols; c++) {
      let writeRow = this.rows - 1;
      // 从底部向上移动
      for (let r = this.rows - 1; r >= 0; r--) {
        if (this.grid[r][c].tileType !== 0) {
          if (r !== writeRow) {
            this.grid[writeRow][c] = this.grid[r][c];
            this.grid[r][c].tileType = 0;
            dropped = true;
          }
          writeRow--;
        }
      }
      // 填充顶部空位
      for (let r = writeRow; r >= 0; r--) {
        this.grid[r][c].tileType = this.getRandomTile();
        dropped = true;
      }
    }
    return dropped;
  }

  /**
   * 处理整个消除链（包含连击）
   */
  public processMatches(): { matches: IMatch[]; score: number } {
    let totalScore = 0;
    let allMatches: IMatch[] = [];
    let hasMatches = true;

    while (hasMatches) {
      const matches = this.findAllMatches();
      if (matches.length === 0) {
        hasMatches = false;
        break;
      }

      // 计算得分（基础10分/个，连击加成）
      let removedCount = this.removeMatches(matches);
      const comboBonus = allMatches.length + 1;
      const score = removedCount * 10 * comboBonus;
      totalScore += score;

      allMatches = allMatches.concat(matches);

      // 掉落填补
      this.dropDown();
    }

    return { matches: allMatches, score: totalScore };
  }

  /**
   * 检查棋盘是否还有可用的交换
   */
  public hasValidMoves(): boolean {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        // 尝试右交换
        if (c < this.cols - 1) {
          this.swap({ row: r, col: c }, { row: r, col: c + 1 });
          const matches = this.findAllMatches();
          // 交换回来
          this.swap({ row: r, col: c }, { row: r, col: c + 1 });
          if (matches.length > 0) return true;
        }
        // 尝试下交换
        if (r < this.rows - 1) {
          this.swap({ row: r, col: c }, { row: r + 1, col: c });
          const matches = this.findAllMatches();
          this.swap({ row: r, col: c }, { row: r + 1, col: c });
          if (matches.length > 0) return true;
        }
      }
    }
    return false;
  }

  /**
   * 重新洗牌（当没有可用交换时）
   */
  public shuffle(): void {
    const tiles: TileType[] = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        tiles.push(this.grid[r][c].tileType);
      }
    }
    // Fisher-Yates洗牌
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
    let idx = 0;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.grid[r][c].tileType = tiles[idx++];
      }
    }
    // 重新处理可能的三消
    this.processMatches();
  }

  /**
   * 获取当前棋盘状态（深拷贝）
   */
  public getBoard(): IBoard {
    return {
      rows: this.rows,
      cols: this.cols,
      grid: this.grid.map(row => [...row])
    };
  }

  /**
   * 打印棋盘（调试用）
   */
  public printBoard(): void {
    console.log('   ' + Array.from({ length: this.cols }, (_, i) => i).join(' '));
    for (let r = 0; r < this.rows; r++) {
      console.log(`${r} | ${this.grid[r].join(' ')}`);
    }
  }
}