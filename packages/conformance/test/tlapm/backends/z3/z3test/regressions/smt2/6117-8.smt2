(*---
description: z3test's regression regressions/smt2/6117-8.smt2.
ref: regressions/smt2/6117-8.smt2
features:
  - z3test
outcome: unsat
---*)
(set-option :model_validate true)
(set-info :status unsat) 

(assert (= (fp (_ bv1 1) (_ bv2047 11) (_ bv0 52)) (fp.fma RTP (fp (_ bv0 1) #b11100001000 (_ bv0 52)) (fp (_ bv1 1) #b11101101011 (_ bv0 52)) (fp (_ bv0 1) (_ bv0 11) (_ bv0 52)))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
