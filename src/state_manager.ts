import type { Page, SiteDatabaseObject } from './types';
import { StateManager } from '@fmma-npm/state';

export type State = {
    pages: Page[];
    sdo: SiteDatabaseObject;
};

export const state_manager = new StateManager<State>({
    emptyState: {
        pages: [], sdo: {
            devVersion: '',
            publishedVersion: '',
            siteTitle: '',
            versions: []
        }
    }
});
