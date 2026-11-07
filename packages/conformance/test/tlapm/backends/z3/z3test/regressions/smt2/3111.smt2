(*---
description: z3test's regression regressions/smt2/3111.smt2.
ref: regressions/smt2/3111.smt2
features:
  - z3test
outcome: sat
---*)
(declare-fun a () Real)
(declare-fun b () Real)
(declare-fun c () Real)
(assert (<= (/ (- 3) c) a))
(check-sat)
(assert (> b 0))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    sat
---*)
