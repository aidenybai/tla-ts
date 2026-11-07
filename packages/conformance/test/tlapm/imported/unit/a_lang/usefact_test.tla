(*---
description: tlapm's own test unit/a_lang/usefact_test.tla.
ref: test/unit/a_lang/usefact_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE usedef_test ----

EXTENDS TLAPS

ASSUME F == FALSE

THEOREM FALSE
    BY F

====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 16:5:16:7
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 16:5:16:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 2
    @loc: 16:8:16:9
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 16:8:16:9
    @status: trivial
    @prover: tlapm
    @already: false

    @type: warning
    @msg: File "./usefact_test.tla", line 9, character 1 to line 18, character 4 :
    Warning: module name "usedef_test" does not match file name "usefact_test.tla".

    @type: obligationsnumber
    @count: 2

    File "./usefact_test.tla", line 9, character 1 to line 18, character 4:
    [INFO]: All 2 obligations proved.
---*)
