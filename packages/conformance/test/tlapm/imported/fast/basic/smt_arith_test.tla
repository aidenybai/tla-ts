(*---
description: tlapm's own test fast/basic/smt_arith_test.tla.
ref: test/fast/basic/smt_arith_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE smt_arith_test ----

EXTENDS TLAPS, Naturals

THEOREM t == 2 + 2 = 4 BY SMT

====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 13:24:13:26
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 13:24:13:26
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 2
    @loc: 13:27:13:30
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 13:27:13:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./smt_arith_test.tla", line 9, character 1 to line 15, character 4:
    [INFO]: All 2 obligations proved.
---*)
