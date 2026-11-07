(*---
description: z3test's regression regressions/smt2/2549.smt2.
ref: regressions/smt2/2549.smt2
features:
  - z3test
outcome: unsat
---*)
(declare-const A0 (Array Int Int))
(declare-const A1 (Array Int Int))
(assert (= A0 ((as const (Array Int Int)) 0)))
(assert (= A1 ((as const (Array Int Int)) 1)))
(assert (= (store A0 2 3) (store A1 2 3)))
(check-sat)
;(get-model)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
