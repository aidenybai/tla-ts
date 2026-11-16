(*---
description: z3test's regression regressions/smt2/4841-2.smt2.
ref: regressions/smt2/4841-2.smt2
features:
  - z3test
outcome: unsat
---*)
(set-option :model_validate true)
(set-info :status unsat)

(set-logic QF_FP)
(declare-fun X () (_ FloatingPoint 11 53))
(declare-fun Y () (_ FloatingPoint 9 53))
(assert (fp.lt X (fp #b0 #b10011111111 #x0000000000000)))
(assert (= Y ((_ to_fp 9 53) RNE X)))
(assert (not (distinct Y (_ +oo 9 53))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
