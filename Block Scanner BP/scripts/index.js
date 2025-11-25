import { system, CommandPermissionLevel, CustomCommandStatus } from "@minecraft/server";

let intervalHandle = null;
let playerScanner = new Map();

function startInterval() {
    if (intervalHandle !== null) return;

    intervalHandle = system.runInterval(() => {
        for (const [id, player] of playerScanner.entries()) {

            if (!player || !player.isValid) {
                playerScanner.delete(id);
                continue;
            }

            const view = player.getBlockFromViewDirection({maxDistance: 16});
            if (!view || !view.block) continue;

            const block = view.block;

            const x = block.location.x;
            const y = block.location.y;
            const z = block.location.z;

            const typeId = block.typeId;
            const states = block.permutation.getAllStates();
            let stateLines = "";
            for (const [stateName, value] of Object.entries(states)) {
                stateLines += `  §7- §a${stateName}: §r${value}\n`;
            }

            player.onScreenDisplay.setActionBar(
                `§bBlock Scanner:\n` +
                `§7- §aX: §r${x}\n` +
                `§7- §aY: §r${y}\n` +
                `§7- §aZ: §r${z}\n` +
                `§7- §aType: §r${typeId}\n` +
                `§7- §aStates:\n${stateLines}`
            );
        }

        // Auto-stop if no players scanning
        if (playerScanner.size === 0) {
            stopInterval();
        }

    }, 5);
}

function stopInterval() {
    if (intervalHandle === null) return;

    system.clearRun(intervalHandle);
    intervalHandle = null;
}

system.beforeEvents.startup.subscribe(({ customCommandRegistry }) => {

    customCommandRegistry.registerCommand(
        {
            name: "scan:blockscan",
            description: "Toggle block scanning on/off",
            permissionLevel: CommandPermissionLevel.Any,
            cheatsRequired: false
        },
        (origin) => {
            const player = origin.sourceEntity;
            if (!player) return { status: CustomCommandStatus.Failure };

            const id = player.id;
            if (playerScanner.has(id)) {
                playerScanner.delete(id);

                if (playerScanner.size === 0) {
                    stopInterval();
                }

                return {
                    status: CustomCommandStatus.Success,
                    message: "§cStopped block scanning!"
                };
            }

            playerScanner.set(id, player);
            startInterval();

            return {
                status: CustomCommandStatus.Success,
                message: "§aBlock scanning enabled!"
            };
        }
    );
});
