(*---
description: z3test's regression regressions/smt2/3106.smt2.
ref: regressions/smt2/3106.smt2
features:
  - z3test
outcome: sat
---*)
(declare-const a Real)
(declare-const b Real)
(assert (not (<= (* (- a b) (- a b) (* a a b b)) 0)))
(check-sat-using nlsat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
