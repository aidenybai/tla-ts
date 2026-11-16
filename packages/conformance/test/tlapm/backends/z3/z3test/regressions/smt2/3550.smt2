(*---
description: z3test's regression regressions/smt2/3550.smt2.
ref: regressions/smt2/3550.smt2
features:
  - z3test
outcome: unsat
---*)
(set-option :rewriter.flat false)
(set-option :proof true)
(declare-fun a () Real)
(declare-fun b () Real)
(assert (< b (* (* a a) 2) b))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
