(*---
description: z3test's regression regressions/smt2/2919.smt2.
ref: regressions/smt2/2919.smt2
features:
  - z3test
outcome: sat
---*)
(declare-fun a () Int)
(declare-fun b () Int)
(declare-fun c () Int)
(declare-fun d () Real)
(assert (= (/ a b) (+ (/ 1 c b) d)))
(assert (> d 1))
(assert (> d 0))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
