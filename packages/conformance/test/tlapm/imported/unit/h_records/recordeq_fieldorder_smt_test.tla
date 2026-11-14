(*---
description: tlapm's own test unit/h_records/recordeq_fieldorder_smt_test.tla.
ref: test/unit/h_records/recordeq_fieldorder_smt_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE recordeq_fieldorder_smt_test ----

\* A record constructor denotes a function whose domain is a set of fields,
\* so the order in which fields are written is immaterial:
\* [ foo |-> x, bar |-> y ] and [ bar |-> y, foo |-> x ] denote the same
\* record.  `Encode.Rewrite.simpl_receq` pairs fields by name, hence the
\* equality decomposes to x = x /\ y = y and holds.  `BY SMT` forces the pass.

EXTENDS TLAPS

THEOREM ASSUME NEW x,
               NEW y
        PROVE  [ foo |-> x, bar |-> y ] = [ bar |-> y, foo |-> x ]
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

    File "./recordeq_fieldorder_smt_test.tla", line 9, character 1 to line 24, character 4:
    [INFO]: All 2 obligations proved.
---*)
