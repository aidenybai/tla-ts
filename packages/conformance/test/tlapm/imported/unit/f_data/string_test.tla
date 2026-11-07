(*---
description: tlapm's own test unit/f_data/string_test.tla.
ref: test/unit/f_data/string_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE string_test ----

EXTENDS TLAPS

THEOREM "foo" \in STRING /\ "bar" \in STRING /\ "baz" \in STRING
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

    File "./string_test.tla", line 9, character 1 to line 16, character 4:
    [INFO]: All 1 obligation proved.
---*)
