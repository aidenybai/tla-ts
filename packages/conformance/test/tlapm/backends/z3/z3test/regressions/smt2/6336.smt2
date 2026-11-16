(*---
description: z3test's regression regressions/smt2/6336.smt2.
ref: regressions/smt2/6336.smt2
features:
  - z3test
outcome: any
---*)
(declare-const x RoundingMode)
(assert (fp.lt (fp (_ bv0 1) (_ bv0 11) (_ bv0 52)) (fp (bvlshr (_ bv0 1) ((_ fp.to_sbv 1) x (fp (_ bv0 1) (_ bv0 11) (_ bv0 52)))) (_ bv0 11) (bvlshr (_ bv0 52) (_ bv0 52)))))
(push)

(*--- recorded
all:
  exit: 0
---*)
