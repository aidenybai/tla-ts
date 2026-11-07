(*---
description: tlapm's own test fast/enabled_cdot/ExpandOnlyCdot_test.tla, which checks stderr status:failed.
ref: test/fast/enabled_cdot/ExpandOnlyCdot_test.tla
features:
  - tlapm-test
mode: proof
outcome: failed
---*)
------------------------ MODULE ExpandOnlyCdot_test ----------------------------
(* Test with `ExpandCdot` and `ENABLED` occurs in scope of `\cdot`.

The proof directive `ExpandENABLED` is not given.
*)
EXTENDS TLAPS


THEOREM ((ENABLED TRUE) \cdot TRUE)
BY ExpandCdot
================================================================================

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 18:1:18:3
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 18:1:18:3
    @status: failed
    @prover: expandcdot
    @meth: time-limit: inf
    @reason: Expr.Action
    @already: false
    @obl: Expr.Action
    Obligation:

    ASSUME TRUE 
    PROVE  (ENABLED TRUE) \cdot TRUE

    @type: obligation
    @id: 2
    @loc: 18:4:18:14
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 18:4:18:14
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./ExpandOnlyCdot_test.tla", line 17, characters 11-22:
    Error: Nested occurrence of the operator `ENABLED` found in scope of `\cdot` when expanding `\cdot`. Using the proof directive `ExpandENABLED` from the module `TLAPS` is expected to avoid this error.For example, writing `BY ExpandENABLED`.
    File "./ExpandOnlyCdot_test.tla", line 18, characters 1-2:
    [ERROR]: Could not prove or check:
               ASSUME ExpandCdot 
               PROVE  (ENABLED TRUE) \cdot TRUE
    File "./ExpandOnlyCdot_test.tla", line 9, character 1 to line 19, character 80:
    [ERROR]: 1/2 obligations failed.
    There were backend errors processing module `"ExpandOnlyCdot_test"`.
---*)
