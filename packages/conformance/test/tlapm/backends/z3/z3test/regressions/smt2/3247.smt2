(*---
description: z3test's regression regressions/smt2/3247.smt2.
ref: regressions/smt2/3247.smt2
features:
  - z3test
outcome: sat
---*)
(set-logic QF_BV)
(declare-const bv_21-0 (_ BitVec 21))
(assert (xor true true true true true true true (= (bvashr (_ bv0 29) (concat (_ bv204 8) bv_21-0)) (_ bv0 29) (_ bv0 29)) true true true))
(check-sat)
(exit)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
