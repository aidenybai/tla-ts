(*---
description: tlapm's own test unit/a_lang/letchain_test.tla.
ref: test/unit/a_lang/letchain_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE letchain_test ----

EXTENDS TLAPS

THEOREM ASSUME NEW a
        PROVE LET b == a
                  c == b
              IN
              a = c
    OBVIOUS

====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 18:5:18:12
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 18:5:18:12
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligationsnumber
    @count: 1

    File "./letchain_test.tla", line 9, character 1 to line 20, character 4:
    [INFO]: All 1 obligation proved.
---*)
