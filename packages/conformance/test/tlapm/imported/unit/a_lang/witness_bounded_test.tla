(*---
description: tlapm's own test unit/a_lang/witness_bounded_test.tla.
ref: test/unit/a_lang/witness_bounded_test.tla
features:
  - tlapm-test
mode: proof
outcome: incomplete
---*)
---- MODULE witness_bounded_test ----

EXTENDS TLAPS

THEOREM ASSUME NEW P(_),
               NEW s,
               NEW a \in s,
               P(a)
               PROVE \E x \in s : P(x)
<1> WITNESS a \in s
<1> QED       (*OBVIOUS*)

====

(*--- recorded
all:
  exit: 11
  transcript: |-
    @type: obligation
    @id: 2
    @loc: 18:1:18:20
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 18:1:18:20
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 3
    @loc: 18:1:18:20
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 18:1:18:20
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 4
    @loc: 18:1:18:20
    @status: to be proved

    @type: obligation
    @id: 4
    @loc: 18:1:18:20
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 5
    @loc: 18:13:18:20
    @status: to be proved

    @type: obligation
    @id: 5
    @loc: 18:13:18:20
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 6
    @loc: 18:13:18:20
    @status: to be proved

    @type: obligation
    @id: 6
    @loc: 18:13:18:20
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 5

    Missing proof at File "./witness_bounded_test.tla", line 19, characters 1-7
    File "./witness_bounded_test.tla", line 9, character 1 to line 21, character 4:
    [ERROR]: Proof incomplete in module "witness_bounded_test": 1 missing, 0 omitted proof step(s).
    File "./witness_bounded_test.tla", line 9, character 1 to line 21, character 4:
    [INFO]: All 5 obligations proved.
---*)
