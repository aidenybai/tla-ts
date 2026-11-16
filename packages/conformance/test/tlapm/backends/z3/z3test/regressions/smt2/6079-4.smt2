(*---
description: z3test's regression regressions/smt2/6079-4.smt2.
ref: regressions/smt2/6079-4.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :model_validate true)

(set-info :status sat) ;; says cvc5

(set-logic ALL)
(assert (= (fp (_ bv1 1) #b11111111110 #b1111111111111111111111111111111111111111111111111111) (fp.fma roundTowardZero (fp (_ bv1 1) #b11111111110 (_ bv0 52)) (fp (_ bv0 1) #b11011010011 (_ bv0 52)) (fp (_ bv0 1) (_ bv0 11) (_ bv0 52)))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
