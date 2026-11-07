(*---
description: z3test's regression regressions/smt2/3732.smt2.
ref: regressions/smt2/3732.smt2
features:
  - z3test
outcome: unsat
---*)
(declare-sort a)
(declare-fun b (a a) a)
(declare-fun c () a)
(declare-fun d () a)
(declare-fun e () a)
(declare-fun f () a)
(assert (= e d (b e c) f))
(assert (distinct f (b d c)))
(check-sat)
(check-sat-using (then qffd smt))

(*--- recorded
all:
  exit: 0
  transcript: |-
    unsat
    unsat
---*)
