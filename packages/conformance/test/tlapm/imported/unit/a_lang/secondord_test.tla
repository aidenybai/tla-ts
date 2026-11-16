(*---
description: tlapm's own test unit/a_lang/secondord_test.tla.
ref: test/unit/a_lang/secondord_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE secondord_test ----

EXTENDS TLAPS

F(x, G(_), y) == TRUE

THEOREM ASSUME NEW a,
               NEW G(_),
               NEW b
               PROVE F(a, G, b) = F(a, G, b)
    OBVIOUS

====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 19:5:19:12
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 19:5:19:12
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligationsnumber
    @count: 1

    File "./secondord_test.tla", line 9, character 1 to line 21, character 4:
    [INFO]: All 1 obligation proved.
---*)
