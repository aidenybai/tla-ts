(*---
description: z3test's regression regressions/smt2/fp-feature-check-1.smt2.
ref: regressions/smt2/fp-feature-check-1.smt2
features:
  - z3test
outcome: sat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-info :status sat)
(set-info :source "Handcrafted by C.M. Wintersteiger")

(declare-fun RM () RoundingMode)

(assert (or
	  (= RM roundNearestTiesToEven)
	  (= RM roundNearestTiesToAway)
	  (= RM roundTowardPositive)
	  (= RM roundTowardNegative)
	  (= RM roundTowardZero)))

(assert (or
	  (= RM RNE)
	  (= RM RNA)
	  (= RM RTP)
	  (= RM RTN)
	  (= RM RTZ)))

(check-sat)
(check-sat-using smt)
(exit)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    sat
---*)
