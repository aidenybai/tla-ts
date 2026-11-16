(*---
description: z3test's regression regressions/smt2/2960.smt2.
ref: regressions/smt2/2960.smt2
features:
  - z3test
outcome: sat
---*)
(declare-fun a (Int) Int)
(declare-fun b (Int) Int)
(declare-fun c () Int)
(declare-fun d () Int)
(declare-fun e () Int)
(declare-fun f () Int)
(declare-fun g () Int)
(declare-fun i () Int)
(assert
 (let ((h (+ c g)) (j (+ c d)))
  (and (or (and (or (distinct c f) (distinct d f)) (distinct d g)) (distinct e g))
   (< i 7)
   (= (a (a (b (ite (< h 7) h c)))) (a (a (b (ite (< j 7) j c))))))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
