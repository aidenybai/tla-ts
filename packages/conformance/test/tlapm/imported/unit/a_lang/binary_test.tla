(*---
description: tlapm's own test unit/a_lang/binary_test.tla.
ref: test/unit/a_lang/binary_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE binary_test ----

EXTENDS TLAPS

THEOREM ASSUME NEW F(_, _),
               NEW a,
               NEW b
               PROVE F(a, b) = F(a, b)
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

    File "./binary_test.tla", line 9, character 1 to line 19, character 4:
    [INFO]: All 1 obligation proved.
---*)
