export type BaseEvents = Record<string, any[]>;

/**
 * 事件总线
 * 实际上就是发布订阅模式的一种简单实现
 * 类型定义受到 {@link https://github.com/andywer/typed-emitter/blob/master/index.d.ts} 的启发，不过只需要声明参数就好了，而不需要返回值（应该是 {@code void}）
 */
export class EventEmitter<Events extends BaseEvents> {
  // 一个对象存放所有的消息订阅
  private readonly events = new Map<keyof Events, Function[]>();

  /**
   * 添加一个事件监听程序
   * @param type 监听类型
   * @param callback 处理回调
   * @returns {@code this}
   */
  add<E extends keyof Events>(type: E, callback: (...args: Events[E]) => void) {
    const callbacks = this.events.get(type) || [];
    callbacks.push(callback);
    this.events.set(type, callbacks);
  }

  /**
   * 移除一个事件监听程序
   * @param type 监听类型
   * @param callback 处理回调
   * @returns {@code this}
   */
  remove<E extends keyof Events>(
    type: E,
    callback: (...args: Events[E]) => void
  ) {
    const callbacks = this.events.get(type) || [];
    this.events.set(
      type,
      callbacks.filter((fn: any) => fn !== callback)
    );
  }

  /**
   * 移除一类事件监听程序
   * @param type 监听类型
   * @returns {@code this}
   */
  removeByType<E extends keyof Events>(type: E) {
    this.events.delete(type);
  }

  /**
   * 触发一类事件监听程序
   * @param type 监听类型
   * @param args 处理回调需要的参数
   * @returns {@code this}
   */
  emit<E extends keyof Events>(type: E, ...args: Events[E]) {
    const callbacks = this.events.get(type) || [];
    callbacks.forEach((fn) => fn(...args));
  }

  /**
   * 获取一类事件监听程序
   * @param type 监听类型
   * @returns 一个只读的数组，如果找不到，则返回空数组 {@code []}
   */
  listeners<E extends keyof Events>(type: E) {
    // Object.freeze() 方法可以冻结一个对象。
    // 一个被冻结的对象再也不能被修改；冻结了一个对象则不能向这个对象添加新的属性，不能删除已有属性，不能修改该对象已有属性的可枚举性、可配置性、可写性，以及不能修改已有属性的值。
    return Object.freeze(this.events.get(type) || []);
  }
}

export default new EventEmitter();
export const enum EventKey {
  showAlert = 'showAlert'
};

// 链接：https://juejin.cn/post/7085566957159710750