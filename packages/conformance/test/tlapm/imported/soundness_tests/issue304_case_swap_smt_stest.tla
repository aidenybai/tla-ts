(*---
description: 'tlapm''s soundness test issue304_case_swap_smt_stest.tla states a false theorem, and tlapm still proves it: https://github.com/tlaplus/tlapm/issues/304.'
ref: test/soundness_tests/issue304_case_swap_smt_stest.tla
features:
  - tlapm-test
  - tlapm-bug
mode: proof
outcome: proved
---*)
------------- MODULE issue304_case_swap_smt_stest --------------

\* https://github.com/tlaplus/tlapm/issues/304
\* A CASE denotes a CHOOSE among the results of its enabled arms; the arms
\* are unordered.  Swapping two enabled arms therefore leaves the value
\* unchanged, and this theorem is false.  Lowering CASE to an ordered
\* IF/ite makes the two sides distinct and proves it.

EXTENDS TLAPS

THEOREM (CASE TRUE -> "u" [] TRUE -> "v" [] OTHER -> "w")
          # (CASE TRUE -> "v" [] TRUE -> "u" [] OTHER -> "w")
BY SMT

=================================================================

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

    File "./issue304_case_swap_smt_stest.tla", line 10, character 1 to line 24, character 65:
    [INFO]: All 2 obligations proved.
---*)
