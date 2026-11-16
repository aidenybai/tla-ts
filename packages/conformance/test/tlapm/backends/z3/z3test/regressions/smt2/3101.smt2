(*---
description: z3test's regression regressions/smt2/3101.smt2.
ref: regressions/smt2/3101.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :smt.arith.solver 6)
(declare-fun a () Int)
(declare-fun b () Real)
(declare-fun c () Real)
(assert (>= a 4))
(assert (= (+ b (* b c)) 3.0))
(check-sat)
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    sat
---*)
