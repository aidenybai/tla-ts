(*---
description: tlapm's own test unit/h_records/recordeq_hyp_smt_test.tla.
ref: test/unit/h_records/recordeq_hyp_smt_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE recordeq_hyp_smt_test ----

\* `Encode.Rewrite.simpl_receq` rewrites record-constructor equalities
\* wherever they occur, including among the assumptions of an ASSUME/PROVE.
\* From an assumed equality of two record constructors with equal domains,
\* each field equality follows.  `BY SMT` forces the pass.

EXTENDS TLAPS

THEOREM ASSUME NEW x, NEW y, NEW u, NEW v,
               [ foo |-> x, bar |-> y ] = [ foo |-> u, bar |-> v ]
        PROVE  /\ x = u
               /\ y = v
BY SMT

====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 22:1:22:3
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 22:1:22:3
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 2
    @loc: 22:4:22:7
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 22:4:22:7
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./recordeq_hyp_smt_test.tla", line 9, character 1 to line 24, character 4:
    [INFO]: All 2 obligations proved.
---*)
