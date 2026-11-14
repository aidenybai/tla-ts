(*---
description: z3test's regression regressions/smt2/3733.smt2.
ref: regressions/smt2/3733.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :model_validate true)
(declare-fun a () Real)
(assert (= a 1))
(check-sat-using (then qffd smt))

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
