export interface IPanelSevenUpSevenDownMainView {
    updateGameStage(): void;
    updateflyChip(data: any): void;
    updateDeletChip(data: any): void;
    updateReconnect(): void;
    getDeskWorldPosByIdx(id:number): void;
    getUserWorldPosByUid(id:number): void;
}


