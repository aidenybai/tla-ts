(*---
description: tlapm's own test unit/h_records/recordext_test.tla.
ref: test/unit/h_records/recordext_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE recorddom_test ----

EXTENDS TLAPS

THEOREM ASSUME NEW x,
               NEW y,
               NEW u,
               NEW v
        PROVE [ foo |-> x, bar |-> y ] = [ foo |-> u, bar |-> v ]
                    <=> /\ x = u
                        /\ y = v
    OBVIOUS

====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 20:5:20:12
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 20:5:20:12
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: warning
    @msg: File "./recordext_test.tla", line 9, character 1 to line 22, character 4 :
    Warning: module name "recorddom_test" does not match file name "recordext_test.tla".

    @type: obligationsnumber
    @count: 1

    File "./recordext_test.tla", line 9, character 1 to line 22, character 4:
    [INFO]: All 1 obligation proved.
---*)
