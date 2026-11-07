(*---
description: tlapm's own test unit/h_records/recordeq_neq_smt_test.tla.
ref: test/unit/h_records/recordeq_neq_smt_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE recordeq_neq_smt_test ----

\* `Encode.Rewrite.simpl_receq` rewrites equalities (=) only; a disequality
\* (#) of two record constructors is not rewritten by the pass but follows
\* from the field-wise equality decomposition by negation: the records
\* differ iff some field differs.  Documents the expected SMT result.

EXTENDS TLAPS

THEOREM ASSUME NEW x, NEW y, NEW u, NEW v
        PROVE  ([ foo |-> x, bar |-> y ] # [ foo |-> u, bar |-> v ])
                    <=> (x # u \/ y # v)
BY SMT

====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 21:1:21:3
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 21:1:21:3
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 2
    @loc: 21:4:21:7
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 21:4:21:7
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./recordeq_neq_smt_test.tla", line 9, character 1 to line 23, character 4:
    [INFO]: All 2 obligations proved.
---*)
