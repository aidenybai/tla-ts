(*---
description: z3test's regression regressions/smt2/3378.smt2.
ref: regressions/smt2/3378.smt2
features:
  - z3test
outcome: sat
---*)
(declare-const a Int)
(declare-const b Int)
(declare-const c Int)
(assert (< a b))
(assert (= c (+ (* a b) a)))
(assert (or (= c (/ a b)) (= c 0)))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
