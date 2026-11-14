(*---
description: z3test's regression regressions/smt2/10220.smt2.
ref: regressions/smt2/10220.smt2
features:
  - z3test
outcome: unsat
---*)
(declare-datatype SBVRational ((SBV.Rational (sbv.rat.numerator Int) (sbv.rat.denominator Int))))
(define-fun sbv.rat.eq ((x SBVRational) (y SBVRational)) Bool
   (= (* (sbv.rat.numerator   x) (sbv.rat.denominator y))
      (* (sbv.rat.denominator x) (sbv.rat.numerator   y)))
)
(define-fun sbv.rat.notEq ((x SBVRational) (y SBVRational)) Bool
   (not (sbv.rat.eq x y))
)
(define-fun s2 () SBVRational (SBV.Rational (- 1) 5))
(define-fun s4 () SBVRational (SBV.Rational (- 1) 1))
(define-fun s6 () SBVRational (SBV.Rational 4 5))
(declare-fun s0 () SBVRational)
(assert (< 0 (sbv.rat.denominator s0)))
(declare-fun s1 () SBVRational)
(assert (< 0 (sbv.rat.denominator s1)))
(define-fun s3 () Bool (sbv.rat.eq s0 s2))
(define-fun s5 () Bool (sbv.rat.eq s1 s4))
(define-fun s7 () Int (sbv.rat.numerator s0))
(define-fun s8 () Int (sbv.rat.denominator s1))
(define-fun s9 () Int (* s7 s8))
(define-fun s10 () Int (sbv.rat.numerator s1))
(define-fun s11 () Int (sbv.rat.denominator s0))
(define-fun s12 () Int (* s10 s11))
(define-fun s13 () Int (- s9 s12))
(define-fun s14 () Int (* s8 s11))
(define-fun s15 () SBVRational (SBV.Rational s13 s14))
(define-fun s16 () Bool (sbv.rat.eq s6 s15))
(assert s3)
(assert s5)
(assert (not s16))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
