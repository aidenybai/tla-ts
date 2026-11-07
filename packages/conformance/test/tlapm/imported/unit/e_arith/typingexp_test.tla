(*---
description: tlapm's own test unit/e_arith/typingexp_test.tla.
ref: test/unit/e_arith/typingexp_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE typingexp_test ----

EXTENDS TLAPS, Integers

THEOREM ASSUME NEW m \in Int,
               NEW n \in Nat,
               m # 0 \/ n > 0
        PROVE (m ^ n) \in Int
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

    File "./typingexp_test.tla", line 9, character 1 to line 19, character 4:
    [INFO]: All 1 obligation proved.
---*)
