(*---
description: z3test's regression regressions/smt2/2935.smt2.
ref: regressions/smt2/2935.smt2
features:
  - z3test
outcome: sat
---*)
(define-sort a () (FloatingPoint))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
