(*---
description: tlapm's own test unit/h_records/recordeq_smt_test.tla.
ref: test/unit/h_records/recordeq_smt_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE recordeq_smt_test ----

\* A record is a function whose domain is its set of fields; two records are
\* equal iff they have equal domains and agree on every field.  The SMT
\* encoding pass `Encode.Rewrite.simpl_receq` rewrites an equality of two
\* record constructors with equal domains into the conjunction of the
\* field-wise equalities before encoding, so the solver need not appeal to
\* function/record extensionality.  `recordext_test` states the same
\* equivalence under the default backend; `BY SMT` here forces the pass.

EXTENDS TLAPS

THEOREM ASSUME NEW x,
               NEW y,
               NEW u,
               NEW v
        PROVE  [ foo |-> x, bar |-> y ] = [ foo |-> u, bar |-> v ]
                    <=> /\ x = u
                        /\ y = v
BY SMT

====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 28:1:28:3
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 28:1:28:3
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 2
    @loc: 28:4:28:7
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 28:4:28:7
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./recordeq_smt_test.tla", line 9, character 1 to line 30, character 4:
    [INFO]: All 2 obligations proved.
---*)
