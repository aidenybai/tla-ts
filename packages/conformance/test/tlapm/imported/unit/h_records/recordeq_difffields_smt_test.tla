(*---
description: tlapm's own test unit/h_records/recordeq_difffields_smt_test.tla.
ref: test/unit/h_records/recordeq_difffields_smt_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE recordeq_difffields_smt_test ----

\* Record constructors with unequal domains denote unequal records.
\* `Encode.Rewrite.simpl_receq` decomposes an equality only when both sides
\* have the same domain (its same_fieldset guard); otherwise it leaves the
\* equality for the solver, which refutes it by domain reasoning.  Here the
\* domains {"foo", "bar"} and {"foo"} differ, so the disequality holds.
\* `BY SMT` forces the pass.

EXTENDS TLAPS

THEOREM ASSUME NEW x,
               NEW y
        PROVE  [ foo |-> x, bar |-> y ] # [ foo |-> x ]
BY SMT

====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 23:1:23:3
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 23:1:23:3
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 2
    @loc: 23:4:23:7
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 23:4:23:7
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./recordeq_difffields_smt_test.tla", line 9, character 1 to line 25, character 4:
    [INFO]: All 2 obligations proved.
---*)
