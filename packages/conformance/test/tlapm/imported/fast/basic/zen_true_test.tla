(*---
description: tlapm's own test fast/basic/zen_true_test.tla.
ref: test/fast/basic/zen_true_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE zen_true_test ----

EXTENDS TLAPS

THEOREM t == TRUE /\ TRUE BY ZenonT (5)

====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 13:27:13:29
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 13:27:13:29
    @status: proved
    @prover: zenon
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 2
    @loc: 13:30:13:40
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 13:30:13:40
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./zen_true_test.tla", line 9, character 1 to line 15, character 4:
    [INFO]: All 2 obligations proved.
---*)
