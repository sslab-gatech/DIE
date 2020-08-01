export class Preference {

    // are array expressions or new expressions allowed?
    noDefs : boolean;
    // are variables allowed?
    noVars : boolean;
    // are literals allowed?
    noLits : boolean;
    // are member expressions allowed?
    noMems : boolean;
    // are expressions allowed?
    noExps : boolean;
    // are builtins allowed?
    noBuis : boolean;
    // are ObjectLike types enabled?
    objectLike : boolean;

    constructor(noDefs = true, noVars = false, noLits = false, noMems = false, noExps = false, noBuis = false, objectLike = true) {
        this.noDefs = noDefs;
        this.noVars = noVars;
        this.noLits = noLits;
        this.noMems = noMems;
        this.noExps = noExps;
        this.noBuis = noBuis;
        this.objectLike = objectLike;
    }
};
export const defaultPreference = new Preference();
export const lValPreference = new Preference(true, false, true, false, true, true, true);
export const objMemPreference = new Preference(true, false, true, false, true, true, false);
export const complexPreference = new Preference(true, true, true, false, false, false, true);
export const initPreference = new Preference(false, false, false, false, false, false, true);