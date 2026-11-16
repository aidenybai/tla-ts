(*---
description: z3test's regression regressions/smt2/6593.smt2.
ref: regressions/smt2/6593.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :model_validate true)
(set-info :status sat)

(set-logic ALL)
(declare-fun c () RoundingMode)
;;(declare-fun m () Float32)

(define-fun m () (_ FloatingPoint 8 24) (fp #b0 #b01111110 #b00000000000000000000000))

(assert (and
  (fp.eq
    (fp (_ bv0 1) (_ bv0 8) (_ bv0 23))
    (fp.div c m (fp (_ bv0 1) (_ bv255 8) (_ bv0 23))))
  (not
    (fp.eq
      (fp (_ bv0 1) (_ bv0 8) (_ bv0 23))
      (fp.div c m ((_ to_fp 8 24) c (/ (ite (fp.geq (fp (_ bv0 1) (_ bv255 8) (_ bv0 23)) m) 1.0 0.0) 2)))))
  ))
(check-sat)
;; (get-model)

;; CVC5 says:
;; (define-fun c () RoundingMode roundTowardZero)
;; (define-fun m () (_ FloatingPoint 8 24) (fp #b0 #b01111110 #b00000000000000000000000))

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
