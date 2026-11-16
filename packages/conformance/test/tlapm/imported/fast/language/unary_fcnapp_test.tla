(*---
description: tlapm's own test fast/language/unary_fcnapp_test.tla.
ref: test/fast/language/unary_fcnapp_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE unary_fcnapp_test ----
EXTENDS TLAPS


f == [x \in {TRUE} |-> TRUE]

THEOREM f[TRUE] = TRUE
BY SMT DEF f

============================

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 16:1:16:3
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 16:1:16:3
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 2
    @loc: 16:4:16:7
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 16:4:16:7
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./unary_fcnapp_test.tla", line 9, character 1 to line 18, character 28:
    [INFO]: All 2 obligations proved.
---*)
