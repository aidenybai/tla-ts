(*---
description: tlapm's own test fast/enabled_cdot/ExpandENABLED_LET_test.tla.
ref: test/fast/enabled_cdot/ExpandENABLED_LET_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
-------------------------- MODULE ExpandENABLED_LET_test -----------------------
(* Unit test of `ExpandENABLED` with `LET` in proof obligation. *)
EXTENDS TLAPS


THEOREM
    ASSUME VARIABLE x
    PROVE
        LET
            Foo(r) == r
        IN
            x => ENABLED /\ Foo(x)
                         /\ Foo(x')
PROOF
    BY ExpandENABLED, Zenon
================================================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 23:5:23:7
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 23:5:23:7
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 2
    @loc: 23:8:23:21
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 23:8:23:21
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 3
    @loc: 23:23:23:28
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 23:23:23:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 3

    File "./ExpandENABLED_LET_test.tla", line 9, character 1 to line 24, character 80:
    [INFO]: All 3 obligations proved.
---*)
