(*---
description: z3test's regression regressions/smt2/fp-rem-4.smt2.
ref: regressions/smt2/fp-rem-4.smt2
features:
  - z3test
outcome: sat
---*)
;; Copyright (c) 2016 Microsoft Corporation

(set-logic QF_FP)
(set-info :status sat)
(set-info :source "Handcrafted by CM Wintersteiger")

(define-sort FPN () (_ FloatingPoint 8 24))
(declare-const m FPN)

(assert (= m (fp.rem
                 (fp #b0 #b10000001 #b11000000000000000000000) ;; +7.0
                 (fp #b0 #b10000001 #b00000000000000000000000) ;; +4.0
                 )))

(set-option :pp.fp_real_literals true)

(check-sat)
(get-value (m))
(check-sat-using smt)
(get-value (m))
(check-sat-using (then fpa2bv smt))
(get-value (m))
(exit)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    ((m ((_ to_fp 8 24) RTZ -1.0 0)))
    sat
    ((m ((_ to_fp 8 24) RTZ -1.0 0)))
    sat
    ((m ((_ to_fp 8 24) RTZ -1.0 0)))
---*)
