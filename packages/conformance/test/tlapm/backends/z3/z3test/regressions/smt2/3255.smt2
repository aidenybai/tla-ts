(*---
description: z3test's regression regressions/smt2/3255.smt2.
ref: regressions/smt2/3255.smt2
features:
  - z3test
outcome: sat
---*)
(set-logic NRA)
(set-option :model_validate true)
(declare-fun ff () Real)
(declare-fun gg () Real)
(declare-const r1 Real)
(declare-const r2 Real)
(declare-const r5 Real)
(assert (distinct r1 0.0 gg r2))
(assert (= r5 (* r2 (/ r2 r1) r1) ff 0.207))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
