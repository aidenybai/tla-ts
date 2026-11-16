(*---
description: tlapm's own test unit/h_records/recorddom_test.tla.
ref: test/unit/h_records/recorddom_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE recorddom_test ----

EXTENDS TLAPS

THEOREM ASSUME NEW x,
               NEW y
        PROVE DOMAIN [ foo |-> x, bar |-> y ] = { "foo", "bar" }
    OBVIOUS

====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 16:5:16:12
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 16:5:16:12
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligationsnumber
    @count: 1

    File "./recorddom_test.tla", line 9, character 1 to line 18, character 4:
    [INFO]: All 1 obligation proved.
---*)
