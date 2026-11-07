(*---
description: 'tlapm''s soundness test issue304_case_first_arm_smt_stest.tla states a false theorem, and tlapm still proves it: https://github.com/tlaplus/tlapm/issues/304.'
ref: test/soundness_tests/issue304_case_first_arm_smt_stest.tla
features:
  - tlapm-test
  - tlapm-bug
mode: proof
outcome: proved
---*)
------------- MODULE issue304_case_first_arm_smt_stest --------------

\* https://github.com/tlaplus/tlapm/issues/304
\* Neither of two enabled CASE arms has priority, so the value of this CASE
\* is unspecified among "u" and "v" and the theorem is false.  Lowering
\* CASE to an ordered IF/ite picks the first arm and proves it.

EXTENDS TLAPS

THEOREM (CASE TRUE -> "u" [] TRUE -> "v") = "u"
BY SMT

=====================================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 20:1:20:3
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 20:1:20:3
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 2
    @loc: 20:4:20:7
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 20:4:20:7
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./issue304_case_first_arm_smt_stest.tla", line 10, character 1 to line 22, character 69:
    [INFO]: All 2 obligations proved.
---*)
