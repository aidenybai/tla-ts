(*---
description: z3test's regression regressions/smt2/4018.smt2.
ref: regressions/smt2/4018.smt2
features:
  - z3test
outcome: unsat
---*)
(declare-fun a () String)
(declare-fun b () String)
(assert (distinct (str.replace a (str.replace "" b "") a) (str.++ a a)))
(check-sat)
(reset)
(declare-fun a () String)
(declare-fun b () Int)
(assert (distinct (str.substr (str.replace "B" a "A") b b) (str.substr "B" 0 (str.indexof "A" a b))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: |-
    unsat
    unsat
---*)
