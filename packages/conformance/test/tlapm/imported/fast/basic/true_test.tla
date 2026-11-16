(*---
description: tlapm's own test fast/basic/true_test.tla.
ref: test/fast/basic/true_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE true_test ----

EXTENDS TLAPS

THEOREM t == TRUE OBVIOUS

====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 13:19:13:26
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 13:19:13:26
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligationsnumber
    @count: 1

    File "./true_test.tla", line 9, character 1 to line 15, character 4:
    [INFO]: All 1 obligation proved.
---*)
