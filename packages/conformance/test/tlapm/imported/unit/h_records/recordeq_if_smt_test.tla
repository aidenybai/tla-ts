(*---
description: tlapm's own test unit/h_records/recordeq_if_smt_test.tla.
ref: test/unit/h_records/recordeq_if_smt_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE recordeq_if_smt_test ----

\* `Encode.Rewrite.simpl_receq` decomposes an equality only when both sides
\* are record constructors; a field value is copied verbatim into the
\* corresponding field equality.  In particular it must not distribute `=`
\* over IF-THEN-ELSE: that is unsound in TLA+, where the guard is not assumed
\* Boolean and IF-THEN-ELSE with a non-Boolean guard denotes an unspecified
\* value.  Here field `foo` is identical on both sides and field `bar`
\* reduces to the assumption x = z.

EXTENDS TLAPS

THEOREM ASSUME NEW c,
               NEW x,
               NEW y,
               NEW z,
               x = z
        PROVE  [ foo |-> (IF c THEN x ELSE y), bar |-> x ]
                    = [ foo |-> (IF c THEN x ELSE y), bar |-> z ]
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

    File "./recordeq_if_smt_test.tla", line 9, character 1 to line 30, character 4:
    [INFO]: All 2 obligations proved.
---*)
