(*---
description: z3test's regression old-regressions/smt2/t69.smt2.
ref: old-regressions/smt2/t69.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation


(declare-const x Int)
(declare-const y Int)
(declare-const z Int)
(declare-fun f (Int Int) Int)
(declare-fun p (Bool) Bool)
(declare-fun q (Int) Bool)

(assert (= x 10))
(assert (= y (+ x 20)))
(assert (= z y))
(assert (>= (f 0 0) 0))
(assert (= (f x z) 0))
(assert (or (p (>= (f 0 0) 0)) (= (f 1 1) 0)))
(assert (q 0))
(assert (not (q 1)))
(assert (or (p (q 0)) (p (q 1))))

(apply propagate-values)

(*--- recorded
all:
  exit: 0
  transcript: |-
    (goals
    (goal
      (= x 10)
      (= y 30)
      (= z 30)
      (>= (f 0 0) 0)
      (= (f 10 30) 0)
      (or (p true) (= (f 1 1) 0))
      (q 0)
      (not (q 1))
      (or (p true) (p false))
      :precision precise :depth 1)
    )
---*)
