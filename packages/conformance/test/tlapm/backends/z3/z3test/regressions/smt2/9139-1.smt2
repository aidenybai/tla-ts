(*---
description: z3test's regression regressions/smt2/9139-1.smt2.
ref: regressions/smt2/9139-1.smt2
features:
  - z3test
outcome: sat
---*)
(declare-const b Real)
(assert (is_int (- (/ (/ (+ 3.0 b) (+ (- (- 3.0)) 2.0)) (/ (+ 3.0 b) (+ (- (- 3.0)) 2.0))) b)))
(assert (< (- 2.0) b))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
