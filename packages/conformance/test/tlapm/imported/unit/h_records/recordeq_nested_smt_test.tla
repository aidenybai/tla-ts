(*---
description: tlapm's own test unit/h_records/recordeq_nested_smt_test.tla.
ref: test/unit/h_records/recordeq_nested_smt_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE recordeq_nested_smt_test ----

\* `Encode.Rewrite.simpl_receq` recurses into nested record constructors: an
\* equality of records whose field values are themselves record constructors
\* reduces to the conjunction of the equalities of the innermost fields.
\* `BY SMT` forces the pass.

EXTENDS TLAPS

THEOREM ASSUME NEW x, NEW y, NEW z,
               NEW u, NEW v, NEW w
        PROVE  ([ a |-> [ p |-> x, q |-> y ], b |-> z ]
                    = [ a |-> [ p |-> u, q |-> v ], b |-> w ])
                    <=> /\ x = u
                        /\ y = v
                        /\ z = w
BY SMT

====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 25:1:25:3
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 25:1:25:3
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 2
    @loc: 25:4:25:7
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 25:4:25:7
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./recordeq_nested_smt_test.tla", line 9, character 1 to line 27, character 4:
    [INFO]: All 2 obligations proved.
---*)
