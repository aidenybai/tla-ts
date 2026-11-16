(*---
description: z3test's regression regressions/smt2/2868.smt2.
ref: regressions/smt2/2868.smt2
features:
  - z3test
outcome: sat
---*)
(declare-fun a () Real)
(declare-fun b () Real)
(declare-fun c () Real)
(declare-fun d () Real)
(declare-fun f () Real)
(declare-fun g () Real)
(declare-fun h () Real)
(declare-fun i () Real)
(define-fun vuscore2dollarskuscore () Real i)
;(declare-fun vuscore2dollarskuscore () Real)
(assert
 (exists ((e Real))
  (and
   (or
    (> (/ 0 (- (+ (* g h) (* b d) (/ 6 b d)) (* (- 39 b d) vuscore2dollarskuscore))) f)
    (< vuscore2dollarskuscore (/ 0 a c)))
   (<= (/ 2 a c) h))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
