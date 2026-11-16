(*---
description: z3test's regression regressions/smt2/t219.smt2.
ref: regressions/smt2/t219.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation


(declare-const x Int)
(declare-const z Int)

(assert (forall ((y Int)) (not (and (<= 0 y) (<= y x)))))
(assert (= z (+ x 1)))

(apply qe)

(*--- recorded
all:
  exit: 0
  transcript: |-
    (goals
    (goal
      (not (>= x 0))
      (= z (+ x 1))
      :precision precise :depth 1)
    )
---*)
