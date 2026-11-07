(*---
description: 'tlapm''s soundness test issue304_case_symbolic_guards_smt_stest.tla states a false theorem, and tlapm still proves it: https://github.com/tlaplus/tlapm/issues/304.'
ref: test/soundness_tests/issue304_case_symbolic_guards_smt_stest.tla
features:
  - tlapm-test
  - tlapm-bug
mode: proof
outcome: proved
---*)
------------- MODULE issue304_case_symbolic_guards_smt_stest --------------

\* https://github.com/tlaplus/tlapm/issues/304
\* With p and q both true, both CASEs choose from {1, 2} under the same
\* predicate, so they are equal and the theorem is false.  Lowering CASE
\* to an ordered IF/ite makes the two sides distinct and proves it.

EXTENDS Naturals, TLAPS

THEOREM ASSUME NEW p, NEW q, p, q
        PROVE  (CASE p -> 1 [] q -> 2 [] OTHER -> 3)
                 # (CASE q -> 2 [] p -> 1 [] OTHER -> 3)
BY SMT

===========================================================================

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

    File "./issue304_case_symbolic_guards_smt_stest.tla", line 10, character 1 to line 24, character 75:
    [INFO]: All 2 obligations proved.
---*)
