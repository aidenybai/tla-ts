(*---
description: z3test's regression regressions/smt2/3972.smt2.
ref: regressions/smt2/3972.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :smt.arith.solver 2)
(declare-const s String)
(assert (and (> (str.len s) 34) (= (str.at s 0) "a")))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
