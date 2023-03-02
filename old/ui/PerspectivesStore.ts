import type { Ad4mClient } from "@perspect3vism/ad4m";
import { readable } from 'svelte/store'

export function perspectivesStore(ad4m: Ad4mClient) {
    //@ts-ignore
	return readable([], async set => {
		let ps = await ad4m.perspective.all()
		set(ps)

		ad4m.perspective.addPerspectiveAddedListener(newP => {
            //@ts-ignore
			ps = [...ps, newP]
			set(ps)
            return null
		})

		ad4m.perspective.addPerspectiveUpdatedListener(updatedP => {
            //@ts-ignore
			ps = ps.map(p => p.uuid == updatedP.uuid ? updatedP : p)
			set(ps)
            return null
		})

		ad4m.perspective.addPerspectiveRemovedListener(removedP => {
			ps = ps.filter(p => p.uuid != removedP)
			set(ps)
            return null
		})
	})
}