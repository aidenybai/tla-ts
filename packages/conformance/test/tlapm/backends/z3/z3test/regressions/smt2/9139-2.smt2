(*---
description: z3test's regression regressions/smt2/9139-2.smt2.
ref: regressions/smt2/9139-2.smt2
features:
  - z3test
outcome: sat
---*)
(declare-fun x0 () Real)
(assert (<= (* (+ x0 (- 13.0)) (- (/ (- (* x0 (- 1.0)) 13.0) (* x0 (- (/ (- 1.0) 13.0)))))) (- 1.0)))
(assert (> (+ 1.0 x0) (/ (- 13.0) (- 1.0))))
(check-sat)
(push)
(assert (or (> 0.0 (- 13.0)) (> 0.0 (- 13.0))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    sat
---*)
