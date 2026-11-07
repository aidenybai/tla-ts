(*---
description: tlapm's own test unit/e_arith/intlitminus1_test.tla.
ref: test/unit/e_arith/intlitminus1_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE intlit_test ----

EXTENDS TLAPS, Integers

THEOREM -1 \in Int
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

    @type: warning
    @msg: File "./intlitminus1_test.tla", line 9, character 1 to line 16, character 4 :
    Warning: module name "intlit_test" does not match file name "intlitminus1_test.tla".

    @type: obligationsnumber
    @count: 1

    File "./intlitminus1_test.tla", line 9, character 1 to line 16, character 4:
    [INFO]: All 1 obligation proved.
---*)
