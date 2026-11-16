(*---
description: z3test's regression regressions/smt2/fp-model_evaluator_1.smt2.
ref: regressions/smt2/fp-model_evaluator_1.smt2
features:
  - z3test
outcome: sat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-logic QF_FP)
(set-info :status sat)

(define-sort FPN () (_ FloatingPoint 11 53))
(declare-fun x () FPN)
(declare-fun r () FPN)
(declare-fun q () FPN)

(assert (= x (fp #b0 #b00010110010 #b1011000000000111000000101011000111101100000100000001)))
(assert (= r (fp #b0 #b00010110010 #b1011000000000111000000101011000111101100000100000001)))
(assert (= q (fp.abs x)))

(assert (= q r))

(check-sat)
(check-sat-using smt)
(get-value (q))
(get-value (x))
(get-value (r))

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    sat
    ((q (fp #b0 #b00010110010 #xb00702b1ec101)))
    ((x (fp #b0 #b00010110010 #xb00702b1ec101)))
    ((r (fp #b0 #b00010110010 #xb00702b1ec101)))
---*)
