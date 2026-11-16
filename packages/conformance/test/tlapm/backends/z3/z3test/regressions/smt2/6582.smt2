(*---
description: z3test's regression regressions/smt2/6582.smt2.
ref: regressions/smt2/6582.smt2
features:
  - z3test
outcome: unsat
---*)
(set-option :model_validate true)
(declare-fun v () Real)
(declare-fun va () Real)
(declare-fun var1507 () Real)
(push)
(assert (or (< 0.0 (/ 1.0 va)) (= 0 (* (/ 0 v) (/ 0 var1507)))))
(assert (forall ((r Real) (a Real) (va Real)) (<= (/ r a) va)))
(check-sat)
(pop)
(assert (< var1507 0.0))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: |-
    unsat
    sat
---*)
