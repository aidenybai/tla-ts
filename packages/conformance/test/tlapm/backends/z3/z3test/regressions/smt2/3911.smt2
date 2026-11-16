(*---
description: z3test's regression regressions/smt2/3911.smt2.
ref: regressions/smt2/3911.smt2
features:
  - z3test
outcome: unsat
---*)
(assert (str.in.re "" ((_ re.loop 189 0) (str.to.re ""))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
