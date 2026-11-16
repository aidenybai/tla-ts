(*---
description: z3test's regression regressions/smt2/3751.smt2.
ref: regressions/smt2/3751.smt2
features:
  - z3test
outcome: unsat
---*)
(set-logic BV)
(declare-fun _substvar_104_ () Bool)
(assert (not (exists ((q6 Bool) (q7 Bool) (q8 Bool) (q9 (_ BitVec 19))) (=> _substvar_104_ q7))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
