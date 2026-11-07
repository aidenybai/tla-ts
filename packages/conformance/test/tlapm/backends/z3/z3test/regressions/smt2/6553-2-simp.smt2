(*---
description: z3test's regression regressions/smt2/6553-2-simp.smt2.
ref: regressions/smt2/6553-2-simp.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :model_validate true)
(set-info :status sat)

(declare-const x Real)
;; (define-fun x () Real (- 1.0))

;;(declare-const xf (_ FloatingPoint 8 24))
(define-fun xf () (_ FloatingPoint 8 24) (_ +oo 8 24))

(declare-fun v () RoundingMode)

(assert (and
  (= xf ((_ to_fp 8 24) v x))
))

; (declare-const chk (_ FloatingPoint 8 24))
; (assert (= chk ((_ to_fp 8 24) RNA -340282346638528859811704183484516925441)))

;;(check-sat-using (then fpa2bv bit-blast simplify smt))
(check-sat)
;;(get-model)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
