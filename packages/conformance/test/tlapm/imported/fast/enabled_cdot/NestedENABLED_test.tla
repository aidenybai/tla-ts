(*---
description: tlapm's own test fast/enabled_cdot/NestedENABLED_test.tla.
ref: test/fast/enabled_cdot/NestedENABLED_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---------------------- MODULE NestedENABLED_test -------------------------------
(* Unit test of `ENABLED` and `\cdot` occurring in scope of `ENABLED`.

This module tests nesting of `ENABLED` without occurrence of definitions
(so without expansion of definitions by the user or by `AutoUSE`.
*)
EXTENDS TLAPS


(* `\cdot` occurs in scope of `ENABLED` and index depth of `z` is larger
than the number of bounds in the quantifier that replaces `ENABLED`.

This theorem tests the shifting of indices after `Lamda`s have been
introduced and before anonymization of the newly introduced `Lambda`
parameters.


*)
THEOREM
    (* The declarations are in a sequent to ensure that the index of `z`
    remains small, even if this theorem is moved to within the module,
    which otherwise could change the number of theorems in the context,
    thus the depth of declarations in the deque of the context,
    so the indices (thus the value of the `z` index would be above the
    value checked at `Expr.Subst.app_ix` for the first pattern case of
    `Bump`). This pertains to testing the functions
    `Expr.Action.shift_indices_after_lambdify` and
    `Expr.Action.shift_indices`.
    *)
    ASSUME VARIABLE w, VARIABLE x, VARIABLE y, VARIABLE z
    PROVE (z = 0) =>
        ENABLED (
            (z = 0 /\ z' = 1 /\ x' /\ y' /\ w')
            \cdot
            (z = 1 /\ z' = 2))
PROOF
    BY ExpandENABLED, ExpandCdot, Zenon

--------------------------------------------------------------------------------
VARIABLE x, y, z


(* `ENABLED` occurs in scope of `ENABLED`. *)
THEOREM
    ENABLED /\ x'
            /\ ENABLED (y' /\ ENABLED (z'))
            /\ ENABLED (x')
PROOF
    BY ExpandENABLED, Zenon


(* `\cdot` occurs in scope of `ENABLED`. *)
THEOREM
    (x = 0) =>
        ENABLED (
            (x = 0 /\ x' = 1)
            \cdot
            (x = 1 /\ x' = 2))
PROOF
    BY ExpandENABLED, ExpandCdot, Zenon

================================================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 45:5:45:7
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 45:5:45:7
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 2
    @loc: 45:8:45:21
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 45:8:45:21
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 3
    @loc: 45:23:45:33
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 45:23:45:33
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 4
    @loc: 45:35:45:40
    @status: to be proved

    @type: obligation
    @id: 4
    @loc: 45:35:45:40
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 5
    @loc: 57:5:57:7
    @status: to be proved

    @type: obligation
    @id: 5
    @loc: 57:5:57:7
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 6
    @loc: 57:8:57:21
    @status: to be proved

    @type: obligation
    @id: 6
    @loc: 57:8:57:21
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 7
    @loc: 57:23:57:28
    @status: to be proved

    @type: obligation
    @id: 7
    @loc: 57:23:57:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 8
    @loc: 68:5:68:7
    @status: to be proved

    @type: obligation
    @id: 8
    @loc: 68:5:68:7
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 9
    @loc: 68:8:68:21
    @status: to be proved

    @type: obligation
    @id: 9
    @loc: 68:8:68:21
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 10
    @loc: 68:23:68:33
    @status: to be proved

    @type: obligation
    @id: 10
    @loc: 68:23:68:33
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 11
    @loc: 68:35:68:40
    @status: to be proved

    @type: obligation
    @id: 11
    @loc: 68:35:68:40
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 11

    File "./NestedENABLED_test.tla", line 9, character 1 to line 70, character 80:
    [INFO]: All 11 obligations proved.
---*)
