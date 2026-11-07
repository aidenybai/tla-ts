(*---
description: z3test's regression regressions/smt2/issue-1694.smt2.
ref: regressions/smt2/issue-1694.smt2
features:
  - z3test
outcome: sat
---*)
; Copyright (c) 2016 Microsoft Corporation

(declare-const x Real)
(assert (< x 1.0))
(assert (forall ((y Real)) (or (< y 0.0) (> y 0.1) (> x (* y y)))))
(check-sat)
(exit)

(assert (not (forall ((x Real))
	    	(=> (< x 1.0)
		    (exists ((y Real))
			    (and (>= y 0.0) (<= y 0.1) (<= x (* y y))))))))
(check-sat)
(exit)

(assert (forall ((x Real))
	    	(=> (< x 1.0)
		    (exists ((y Real))
			    (and (>= y 0.0) (<= y 0.1) (<= x (* y y)))))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
