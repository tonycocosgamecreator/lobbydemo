
export interface IPanelJmMainView {

    stageChanged(): void;

    flyChip(id: number): void;

    reconnect(): void;

    flyOtherChip(value: jmbaccarat.BetPlayer[]): void;
}


