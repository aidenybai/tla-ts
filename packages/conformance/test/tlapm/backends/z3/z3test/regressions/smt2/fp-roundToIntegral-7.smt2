(*---
description: z3test's regression regressions/smt2/fp-roundToIntegral-7.smt2.
ref: regressions/smt2/fp-roundToIntegral-7.smt2
features:
  - z3test
outcome: sat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-logic QF_FP)
(set-info :status sat)
(set-info :source "Handcrafted by CM Wintersteiger")

(define-sort FPN () (_ FloatingPoint 8 24))
(declare-fun x () FPN)
(declare-fun r () FPN)
(declare-fun m () FPN)

(assert (= x (fp #b0 #b01111111 #b00000000000000000000000)))
(assert (= r (fp.roundToIntegral RNE x)))

(check-sat)
(get-value (x))
(get-value (r))

(check-sat-using (then
                     fpa2bv
                     (using-params simplify :elim_and true)
                     bit-blast
                     sat))
(get-value (r))
(exit)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    ((x (fp #b0 #x7f #b00000000000000000000000)))
    ((r (fp #b0 #x7f #b00000000000000000000000)))
    sat
    ((r (fp #b0 #x7f #b00000000000000000000000)))
---*)
