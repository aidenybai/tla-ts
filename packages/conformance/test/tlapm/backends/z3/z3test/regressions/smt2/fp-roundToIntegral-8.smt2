(*---
description: z3test's regression regressions/smt2/fp-roundToIntegral-8.smt2.
ref: regressions/smt2/fp-roundToIntegral-8.smt2
features:
  - z3test
outcome: unsat
---*)
(set-logic QF_FP)
(set-info :status unsat)
(declare-fun x () (_ FloatingPoint 8 24))
(declare-fun rm () RoundingMode)
(assert (not (= (fp.roundToIntegral rm (fp.roundToIntegral rm x))
                (fp.roundToIntegral rm x))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
