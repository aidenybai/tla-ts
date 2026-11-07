(*---
description: z3test's regression regressions/smt2/3221.smt2.
ref: regressions/smt2/3221.smt2
features:
  - z3test
outcome: sat
---*)
(declare-fun n () Int)
;(push)
(assert (= (mod n n) 1))
(check-sat)
;(get-model)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
