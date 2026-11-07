(*---
description: tlapm's own test unit/a_lang/extends_test.tla.
ref: test/unit/a_lang/extends_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE extends_test ----

EXTENDS TLAPS, Integers

THEOREM Nat = Nat
    OBVIOUS

====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 14:5:14:12
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 14:5:14:12
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligationsnumber
    @count: 1

    File "./extends_test.tla", line 9, character 1 to line 16, character 4:
    [INFO]: All 1 obligation proved.
---*)
