---
"tla-ts": patch
---

Check models with less memory and fewer instructions:

- Keep states as rows of integers in fixed chunks and share their values. Peak memory on `Detlefs` falls from 4.83 GB to 427 MB.
- Find a symmetry representative on packed integers, and write a permutation's image only as far as a comparison needs it. As in TLC, a replaced image is never sorted, so it can't fail.
- Skip the representative or the view of a successor that is identical to a stored state, when the view is pure. `RaftWithReconfigJointConsensus` falls from 404 G to 206 G instructions.
- Generate code for more of the evaluator: operator calls, quantifier and set bodies, `CASE`, builtin calls, and reads of local names. Select record fields and find function keys without a comparison when the key is the same object.
- Read a tuple as a sequence without scanning its domain, and rank a string key once per search. The engine262 port's `built-ins/Function` test262 suite falls from 13,054 G to 3,241 G instructions with these and `CASE`.
- Build functions and `Append` results with arrays of the exact size. Peak memory on the longest test in that suite falls from 2,139 MB to 1,932 MB.
- Build a tuple, or a record written in sorted order, once when its parts are number or string literals. Functions are now class instances, since V8 moved short-lived ones to old space after enough from one object literal lived long. Peak memory on that test falls from 2,066 MB to 1,857 MB, with instructions flat.
- Fingerprint each stored value once for the end-of-run collision estimate, instead of in every state that holds it. Extending a fingerprint is linear, so a state extends by zeros and adds each value's fingerprint. `Detlefs` falls from 444 G to 370 G instructions, and `MCLamportMutex` from 190 G to 174 G.
- Use workers for specs whose impure definitions the search never evaluates.

A caller of `check` that doesn't read `fingerprintDistance` can set `isFingerprintDistanceSkipped` to skip fingerprinting every state again after the search.
