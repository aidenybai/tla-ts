(*---
description: z3test's regression regressions/smt2/3264.smt2.
ref: regressions/smt2/3264.smt2
features:
  - z3test
outcome: sat
---*)
(set-logic QF_NIA)
(declare-fun _substvar_18_ () Int)
(set-option :model_validate true)
(set-option :smt.phase_selection 5)
(declare-const i10 Int)
(declare-const i11 Int)
(assert (> (div 33 (* i11 i10 16 33 _substvar_18_)) 0))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
