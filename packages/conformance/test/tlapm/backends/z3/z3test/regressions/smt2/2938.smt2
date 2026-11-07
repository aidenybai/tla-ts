(*---
description: z3test's regression regressions/smt2/2938.smt2.
ref: regressions/smt2/2938.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :model_validate true)
(declare-fun f (Int Int Int) Int)
(declare-fun g (Int Int Int) Int)
(declare-fun a () Int)
(assert (let ((b (f a a a))) (let ((c (f b a a))) (< (g b b 2) (- c)))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
