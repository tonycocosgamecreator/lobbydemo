/**
 * 可复用的对象需要继承这个接口
 */
export default interface IReusable {
    unuse(): void;
    reuse(): void;
}
