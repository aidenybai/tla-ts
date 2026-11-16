(*---
description: tlapm's own test fast/language/nary_fcnapp_test.tla.
ref: test/fast/language/nary_fcnapp_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE nary_fcnappi_test ----
EXTENDS TLAPS


f == [x \in {TRUE} \X {TRUE} |-> TRUE]

THEOREM f[TRUE, TRUE] = TRUE
<1>1. <<TRUE, TRUE>> \in {TRUE} \X {TRUE}
    OBVIOUS
<1> QED
    BY <1>1, SMT DEF f

============================

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 19:5:19:7
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 19:5:19:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 2
    @loc: 19:8:19:12
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 19:8:19:12
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 3
    @loc: 19:14:19:17
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 19:14:19:17
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 4
    @loc: 17:5:17:12
    @status: to be proved

    @type: obligation
    @id: 4
    @loc: 17:5:17:12
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: warning
    @msg: File "./nary_fcnapp_test.tla", line 9, character 1 to line 21, character 28 :
    Warning: module name "nary_fcnappi_test" does not match file name "nary_fcnapp_test.tla".

    @type: obligationsnumber
    @count: 4

    File "./nary_fcnapp_test.tla", line 9, character 1 to line 21, character 28:
    [INFO]: All 4 obligations proved.
---*)
