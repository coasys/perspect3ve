import { linkEqual, LinkQuery } from "@perspect3vism/ad4m";
import { readable } from 'svelte/store';
export async function linksStoreForPerspective(ad4m, perspectiveHandle) {
    const perspectiveProxy = await ad4m.perspective.byUUID(perspectiveHandle.uuid);
    return readable([], set => {
        let allLinks = [];
        set(allLinks);
        perspectiveProxy.addListener('link-added', newLink => {
            allLinks = [...allLinks, newLink];
            set(allLinks);
            return null;
        });
        perspectiveProxy.addListener('link-removed', removedLink => {
            allLinks = allLinks.filter(l => !linkEqual(l, removedLink));
            set(allLinks);
            return null;
        });
        async function init() {
            let links;
            links = await ad4m.perspective.queryLinks(perspectiveHandle.uuid, new LinkQuery({}));
            allLinks = links;
            set(allLinks);
        }
        init();
    });
}
//# sourceMappingURL=LinksStore.js.map