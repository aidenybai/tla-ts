(*---
description: z3test's regression regressions/smt2/2943.smt2.
ref: regressions/smt2/2943.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :smt.arith.solver 6)
(declare-fun a () Real)
(declare-fun b () Real)
(declare-fun c () Real)
(declare-fun d () Real)
(declare-fun e () Real)
(assert (exists ((f Real))
  (let ((a!1 (- (- (- (- 1.0 b) d) a) c)))
  (let ((a!2 (/ (/ f (- (/ a c))) (* 2.0 (+ a!1 e) (+ 2.0 a c e)))))
    (> 0.0 (/ a!2 (- b d)))))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
