(*---
description: tlapm's own test unit/e_arith/typingquotient_test.tla.
ref: test/unit/e_arith/typingquotient_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE typingquotient_test ----

EXTENDS TLAPS, Integers

THEOREM ASSUME NEW m \in Int,
               NEW n \in Int,
               n > 0
        PROVE (m \div n) \in Int
    OBVIOUS

====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 17:5:17:12
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 17:5:17:12
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligationsnumber
    @count: 1

    File "./typingquotient_test.tla", line 9, character 1 to line 19, character 4:
    [INFO]: All 1 obligation proved.
---*)
