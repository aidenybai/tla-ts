(*---
description: z3test's regression regressions/smt2/6052.smt2.
ref: regressions/smt2/6052.smt2
features:
  - z3test
outcome: sat
---*)
(declare-fun a () Int)
(assert (= "B" (str.replace "B" "" (str.substr "A" 0 a))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
