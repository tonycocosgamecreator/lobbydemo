export interface IPanelSevenUpSevenDownMainView {
    updateGameStage(): void;
    updateflyChip(data: any, isme: boolean, order: number): void;
    updateDeletChip(data: any, isme: boolean): void;
    updateReconnect(): void;
    getDeskWorldPosByIdx(id: number, isme: boolean, order: number): void;
    getUserWorldPosByUid(id: string, icon: number): void;
    getUserLoseWorldPos(): void;
}


