(*---
description: z3test's regression regressions/smt2/fp-model_evaluator_3.smt2.
ref: regressions/smt2/fp-model_evaluator_3.smt2
features:
  - z3test
outcome: sat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-logic QF_FPBV)
(set-info :status sat)

(define-sort FPN () (_ FloatingPoint 11 53))
(declare-fun x () (_ BitVec 32))
(declare-fun r () FPN)
(declare-fun q () FPN)

(assert (= x #x00000003))
(assert (= r (fp #b0 #b10000000000 #b1000000000000000000000000000000000000000000000000000)))
(assert (= q ((_ to_fp_unsigned 11 53) RTZ x)))

(assert (= (fp.min q r) (fp.min r q)))

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
    ((q (fp #b0 #b10000000000 #x8000000000000)))
    ((x #x00000003))
    ((r (fp #b0 #b10000000000 #x8000000000000)))
---*)
