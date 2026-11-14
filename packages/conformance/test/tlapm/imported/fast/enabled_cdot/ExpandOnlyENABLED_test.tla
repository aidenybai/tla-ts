(*---
description: tlapm's own test fast/enabled_cdot/ExpandOnlyENABLED_test.tla, which checks stderr status:failed.
ref: test/fast/enabled_cdot/ExpandOnlyENABLED_test.tla
features:
  - tlapm-test
mode: proof
outcome: failed
---*)
-------------------------- MODULE ExpandOnlyENABLED_test -----------------------
(* Test with `ExpandENABLED` and `\cdot` occurs in scope of `ENABLED`.

The proof directive `ExpandCdot` is not given.
*)
EXTENDS TLAPS


THEOREM ENABLED (TRUE \cdot TRUE)
BY ExpandENABLED
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
    @prover: expandenabled
    @meth: time-limit: inf
    @reason: Expr.Action
    @already: false
    @obl: Expr.Action
    Obligation:

    ASSUME TRUE 
    PROVE  ENABLED (TRUE \cdot TRUE)

    @type: obligation
    @id: 2
    @loc: 18:4:18:17
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 18:4:18:17
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./ExpandOnlyENABLED_test.tla", line 17, characters 18-32:
    Error: Nested occurrence of the operator `\cdot` found in scope of `ENABLED` when expanding `ENABLED`. Using the proof directive `ExpandCdot` from the module `TLAPS` is expected to avoid this error.For example, writing `BY ExpandCdot`.
    File "./ExpandOnlyENABLED_test.tla", line 18, characters 1-2:
    [ERROR]: Could not prove or check:
               ASSUME ExpandENABLED 
               PROVE  ENABLED (TRUE \cdot TRUE)
    File "./ExpandOnlyENABLED_test.tla", line 9, character 1 to line 19, character 80:
    [ERROR]: 1/2 obligations failed.
    There were backend errors processing module `"ExpandOnlyENABLED_test"`.
---*)
