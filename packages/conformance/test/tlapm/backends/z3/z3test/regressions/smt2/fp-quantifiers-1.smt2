(*---
description: z3test's regression regressions/smt2/fp-quantifiers-1.smt2.
ref: regressions/smt2/fp-quantifiers-1.smt2
features:
  - z3test
outcome: sat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-info :status sat)

(assert (forall ((x (_ FloatingPoint 5 11)))
		  (exists ((y (_ FloatingPoint 5 11)))
			(=> (= x y) (fp.eq x y)))))

(check-sat)
(check-sat-using smt)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    sat
---*)
