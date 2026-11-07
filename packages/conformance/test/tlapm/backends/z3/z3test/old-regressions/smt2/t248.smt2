(*---
description: z3test's regression old-regressions/smt2/t248.smt2.
ref: old-regressions/smt2/t248.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation



;; (to-poly (^ (+ (* (/ 1. 3.) a) (* (/ 1. 5.) b) 2.) 2.))

(declare-const a Real)
(declare-const b Real)

(push)
(assert 
(>
(+ (* (^ (/ 1.0 5.0) 2.0) (^ b 2.0))
   (* 2.0 (/ 1.0 3.0) a (/ 1.0 5.0) b)
   (* 4.0 (/ 1.0 5.0) b)
   (* (^ (/ 1.0 3.0) 2.0) (^ a 2.0))
   (* 4.0 (/ 1.0 3.0) a)
   4.0)
0.0))
(apply (and-then simplify factor))
(pop)

(push)
(assert 
(>
(+ (* (^ (/ 1.0 6.0) 2.0) (^ b 2.0))
   (* 2.0 (/ 1.0 15.0) a (/ 1.0 6.0) b)
   (* 4.0 (/ 1.0 6.0) b)
   (* (^ (/ 1.0 15.0) 2.0) (^ a 2.0))
   (* 4.0 (/ 1.0 15.0) a)
   4.0)
0.0))
(apply (and-then simplify factor))
(pop)

(*--- recorded
all:
  exit: 0
  transcript: |-
    (goals
    (goal
      (not (= (+ (* 5.0 a) (* 3.0 b) 30.0) 0.0))
      :precision precise :depth 2)
    )
    (goals
    (goal
      (not (= (+ (* 2.0 a) (* 5.0 b) 60.0) 0.0))
      :precision precise :depth 2)
    )
---*)
