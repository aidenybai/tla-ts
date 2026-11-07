(*---
description: z3test's regression regressions/smt2/6079-8-simp.smt2.
ref: regressions/smt2/6079-8-simp.smt2
features:
  - z3test
outcome: unsat
---*)
(set-option :model_validate true)
(set-info :status unsat)

(declare-fun f () (_ FloatingPoint 5 11))
(declare-fun bv () (_ BitVec 66))

(assert (= bv (mkbv
    false false false false false false false false false false false false false false false false
    false false false false false false false false false false false false false false false false
    false false false false false false false false false false false false false false false false
    false false false false false false false false false false false false false false false false
    false true)))

(assert (= f ((_ to_fp 5 11) roundTowardZero bv)))

(assert (= (fp (_ bv1 1) (_ bv0 5) (_ bv0 10)) f))

(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
