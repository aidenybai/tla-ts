(*---
description: tlapm's own test unit/h_records/recordeq_three_smt_test.tla.
ref: test/unit/h_records/recordeq_three_smt_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE recordeq_three_smt_test ----

\* Field-wise decomposition of an equality of two three-field record
\* constructors, exercising the n-ary conjunction of field equalities built
\* by `Encode.Rewrite.simpl_receq` for domains of size greater than two.
\* `BY SMT` forces the pass.

EXTENDS TLAPS

THEOREM ASSUME NEW x, NEW y, NEW z,
               NEW p, NEW q, NEW r
        PROVE  ([ a |-> x, b |-> y, c |-> z ] = [ a |-> p, b |-> q, c |-> r ])
                    <=> /\ x = p
                        /\ y = q
                        /\ z = r
BY SMT

====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 24:1:24:3
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 24:1:24:3
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 2
    @loc: 24:4:24:7
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 24:4:24:7
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./recordeq_three_smt_test.tla", line 9, character 1 to line 26, character 4:
    [INFO]: All 2 obligations proved.
---*)
