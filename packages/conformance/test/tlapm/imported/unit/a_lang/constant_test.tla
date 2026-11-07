(*---
description: tlapm's own test unit/a_lang/constant_test.tla.
ref: test/unit/a_lang/constant_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE constant_test ----

EXTENDS TLAPS

THEOREM ASSUME NEW a
               PROVE a = a
    OBVIOUS

====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 15:5:15:12
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 15:5:15:12
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligationsnumber
    @count: 1

    File "./constant_test.tla", line 9, character 1 to line 17, character 4:
    [INFO]: All 1 obligation proved.
---*)
