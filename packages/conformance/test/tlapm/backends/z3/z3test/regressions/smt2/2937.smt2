(*---
description: z3test's regression regressions/smt2/2937.smt2.
ref: regressions/smt2/2937.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :model_validate true)
(declare-fun a () String)
(declare-fun b () String)
(assert (distinct (str.prefixof a (str.substr b 20 2)) (str.prefixof a (str.at b 7))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
