(*---
description: z3test's regression regressions/smt2/6117-5.smt2.
ref: regressions/smt2/6117-5.smt2
features:
  - z3test
outcome: unsat
---*)
(set-option :model_validate true)
(set-info :status unsat) 

(assert (distinct (fp (_ bv0 1) #b11111111110 #b1111111111111111111111111111111111111111111111111111)
         (fp.fma RTN (fp (_ bv1 1) #b11101011010 (_ bv0 52))
          (fp (_ bv1 1) #b11101011010 (_ bv0 52))
          (fp (_ bv0 1) (_ bv0 11) (_ bv0 52)))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
