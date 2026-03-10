/**
 * Vite plugin to fix @phosphor-icons/react export naming mismatch.
 *
 * @cloudflare/kumo imports icons with an "Icon" suffix (e.g. CaretLeftIcon),
 * but @phosphor-icons/react v2.x exports them without it (e.g. CaretLeft).
 * This plugin intercepts the import and serves a shim that re-exports
 * everything under both naming conventions.
 */
import type { Plugin } from "vite";
import path from "node:path";

// Every icon name that @cloudflare/kumo imports with the "Icon" suffix
const KUMO_ICON_ALIASES: Record<string, string> = {
    CaretLeftIcon: "CaretLeft",
    CaretRightIcon: "CaretRight",
    CaretDownIcon: "CaretDown",
    CaretUpDownIcon: "CaretUpDown",
    CaretDoubleLeftIcon: "CaretDoubleLeft",
    CaretDoubleRightIcon: "CaretDoubleRight",
    CheckIcon: "Check",
    XIcon: "X",
    CopyIcon: "Copy",
    MinusIcon: "Minus",
    ArrowRightIcon: "ArrowRight",
    ArrowSquareOutIcon: "ArrowSquareOut",
    MagnifyingGlassIcon: "MagnifyingGlass",
    GlobeHemisphereWestIcon: "GlobeHemisphereWest",
    WarningCircleIcon: "WarningCircle",
};

const VIRTUAL_MODULE_ID = "\0phosphor-icons-compat";

export function phosphorIconsCompat(): Plugin {
    let resolvedPath: string;

    return {
        name: "phosphor-icons-compat",
        enforce: "pre",

        configResolved(config) {
            // Resolve the absolute filesystem path directly, bypassing the
            // package.json "exports" field that blocks subpath require().
            const root = config.root ?? process.cwd();
            resolvedPath = path.resolve(
                root,
                "node_modules/@phosphor-icons/react/dist/index.es.js"
            );
        },

        resolveId(source) {
            if (source === "@phosphor-icons/react") {
                return VIRTUAL_MODULE_ID;
            }
        },

        load(id) {
            if (id === VIRTUAL_MODULE_ID) {
                const lines = [`export * from "${resolvedPath}";`];

                for (const [alias, original] of Object.entries(KUMO_ICON_ALIASES)) {
                    lines.push(
                        `export { ${original} as ${alias} } from "${resolvedPath}";`
                    );
                }

                return lines.join("\n");
            }
        },
    };
}
