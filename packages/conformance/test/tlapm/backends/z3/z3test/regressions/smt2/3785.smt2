(*---
description: z3test's regression regressions/smt2/3785.smt2.
ref: regressions/smt2/3785.smt2
features:
  - z3test
outcome: unsat
---*)
(set-logic HORN)
;(set-option :proof true)
(set-option :fp.xform.bit_blast true)
(assert (forall ((q21 (_ BitVec 10)) (q22 (_ BitVec 10)) (q23 (_ BitVec 12))) (= (_ bv0 12) q23)))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
