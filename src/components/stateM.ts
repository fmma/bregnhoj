import type { Page, SiteDatabaseObject } from './Types';
import { StateManager } from '@fmma-npm/state';

export type State = {
    pages: Page[];
    sdo: SiteDatabaseObject;
};

export const stateM = new StateManager<State>({
    emptyState: {
        pages: [], sdo: {
            devVersion: '',
            publishedVersion: '',
            siteTitle: '',
            versions: []
        }
    }
});
