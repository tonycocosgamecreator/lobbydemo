import { Vec3 } from "cc";

export interface IPanelGameMainView {
    updateGameStage(): void;
    updateReconnect(): void;
    updateflyChip(data: any, order: number): void;
    getWorldPosByUid(playid: string): Vec3;
    getMyHeadWorldPos(): Vec3;
    getChipWorldPos(): Vec3;
    getDeskWorldPosByAid(areaid: number): Vec3;
    getLoseWorldPos(): Vec3;
    updateDeletChip(data: any, isme: boolean): void;
}


