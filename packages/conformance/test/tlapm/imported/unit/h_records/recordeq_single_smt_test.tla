(*---
description: tlapm's own test unit/h_records/recordeq_single_smt_test.tla.
ref: test/unit/h_records/recordeq_single_smt_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE recordeq_single_smt_test ----

\* Field-wise decomposition of an equality of two single-field record
\* constructors by `Encode.Rewrite.simpl_receq`.  `BY SMT` forces the pass.

EXTENDS TLAPS

THEOREM ASSUME NEW x,
               NEW y
        PROVE  ([ foo |-> x ] = [ foo |-> y ]) <=> (x = y)
BY SMT

====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 19:1:19:3
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 19:1:19:3
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 2
    @loc: 19:4:19:7
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 19:4:19:7
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./recordeq_single_smt_test.tla", line 9, character 1 to line 21, character 4:
    [INFO]: All 2 obligations proved.
---*)
