import { Vec3 } from "cc";

export interface IPanelGameMainView {
    updateReconnect(): void;
    updateGameStage(): void;
    updateflyChip(data: any, order: number): void;
    updateDeletChip(data: any, isme: boolean): void;
    getDeskWorldPosByAid(areaid: number): Vec3;
    getWorldPosByUid(playid: string): Vec3;
    getLoseWorldPos(): Vec3;
    getMyHeadWorldPos(): Vec3;
}


