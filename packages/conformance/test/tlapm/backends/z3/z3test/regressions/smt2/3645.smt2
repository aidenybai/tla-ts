(*---
description: z3test's regression regressions/smt2/3645.smt2.
ref: regressions/smt2/3645.smt2
features:
  - z3test
outcome: sat
---*)
(set-logic NRA)
(set-option :model_validate true)
(set-option :smt.arith.solver 6)
(declare-const r0 Real)
(declare-const r1 Real)
(push 1)
(assert (< 0.0 r1))
(assert (> 0.0 (- (* r1 r0) r0)))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
