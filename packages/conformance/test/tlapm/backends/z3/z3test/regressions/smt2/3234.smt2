(*---
description: z3test's regression regressions/smt2/3234.smt2.
ref: regressions/smt2/3234.smt2
features:
  - z3test
outcome: sat
---*)
(declare-sort $$unsorted 0)
(declare-fun $$rtu (Real) $$unsorted)
(declare-fun $$utr ($$unsorted) Real)
(declare-fun p ($$unsorted) Bool)
(assert (= true (= ($$utr ($$rtu 12)) 12) (= ($$utr ($$rtu (- 41 152))) (- 41 152)) ))
(assert (exists ((x $$unsorted)) (p x)))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
