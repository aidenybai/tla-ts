(*---
description: z3test's regression old-regressions/smt2/t241.smt2.
ref: old-regressions/smt2/t241.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation



(declare-const a Real)
(declare-const b Real)

(assert (= (* (root-obj (+ (^ x 5) (* (- 1) x) (- 1)) 1) a)
           1.))

(assert (= (* (^ 2. (/ 1. 2.)) b) 1.))

(apply (! purify-arith :elim-root-objects false))

(*--- recorded
all:
  exit: 0
  transcript: |-
    (goals
    (goal
      (= (* (root-obj (+ (^ x 5) (* (- 1) x) (- 1)) 1) a) 1.0)
      (= (* (root-obj (+ (^ x 2) (- 2)) 2) b) 1.0)
      :precision precise :depth 4)
    )
---*)
