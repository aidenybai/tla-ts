(*---
description: z3test's regression regressions/smt2/fp-to_fp_float-3.smt2.
ref: regressions/smt2/fp-to_fp_float-3.smt2
features:
  - z3test
outcome: unsat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-logic QF_FPBV)
(set-info :status unsat)

(declare-fun x () (_ FloatingPoint 2 5))
(declare-fun y () (_ FloatingPoint 2 5))
(declare-fun cx () (_ FloatingPoint 2 6))
(declare-fun cy () (_ FloatingPoint 2 6))

(assert (not (fp.eq x y)))

(assert (= cx ((_ to_fp 2 6) roundTowardZero x)))
(assert (= cy ((_ to_fp 2 6) roundTowardZero y)))

(assert (fp.eq cx cy))

(check-sat)
(check-sat-using smt)

(*--- recorded
all:
  exit: 0
  transcript: |-
    unsat
    unsat
---*)
