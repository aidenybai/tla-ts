(*---
description: z3test's regression regressions/smt2/fp-predicates.smt2.
ref: regressions/smt2/fp-predicates.smt2
features:
  - z3test
outcome: sat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-info :status sat)
(set-info :source "Handcrafted by C.M. Wintersteiger")

(declare-fun X () (_ FloatingPoint 11 53))

(assert (fp.isNormal X))
(assert (not (fp.isSubnormal X)))
(assert (not (fp.isZero X)))
(assert (not (fp.isInfinite X)))
(assert (not (fp.isNaN X)))
(assert (not (fp.isNegative X)))
(assert (fp.isPositive X))

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
