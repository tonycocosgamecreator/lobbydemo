
export interface IPanelJmMainView {

    stageChanged(reconnect: boolean): void;

    flyChip(): void;

    //根据状态播放动画
    playAnimationByStage(stage: number): void;
}


