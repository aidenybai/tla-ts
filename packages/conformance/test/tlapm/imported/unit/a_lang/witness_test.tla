(*---
description: tlapm's own test unit/a_lang/witness_test.tla.
ref: test/unit/a_lang/witness_test.tla
features:
  - tlapm-test
mode: proof
outcome: incomplete
---*)
---- MODULE witness_test ----

EXTENDS TLAPS

THEOREM ASSUME NEW P(_),
               NEW a,
               P(a)
               PROVE \E x : P(x)
<1> WITNESS a
<1> QED       (*OBVIOUS*)

====

(*--- recorded
all:
  exit: 11
  transcript: |-
    @type: obligation
    @id: 2
    @loc: 17:1:17:14
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 17:1:17:14
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligationsnumber
    @count: 1

    Missing proof at File "./witness_test.tla", line 18, characters 1-7
    File "./witness_test.tla", line 9, character 1 to line 20, character 4:
    [ERROR]: Proof incomplete in module "witness_test": 1 missing, 0 omitted proof step(s).
    File "./witness_test.tla", line 9, character 1 to line 20, character 4:
    [INFO]: All 1 obligation proved.
---*)
