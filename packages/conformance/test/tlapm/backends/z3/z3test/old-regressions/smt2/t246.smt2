(*---
description: z3test's regression old-regressions/smt2/t246.smt2.
ref: old-regressions/smt2/t246.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation


(declare-const a Int)
(declare-const b Int)

(push)
(assert (> 1 0))
(apply factor)
(pop)

(push)
(assert (> a 1))
(assert (> a (+ b 1)))
(apply factor)
(pop)

(push)
(assert (> a 1))
(assert (> (^ (- a (+ b 1)) 3) 0))
(apply factor)
(pop)


(push)
(assert (> a 1))
(assert (> (* (^ (- a (+ b 1)) 3) (^ a 2)) 0))
(apply factor)
(pop)

(*--- recorded
all:
  exit: 0
  transcript: |-
    (goals
    (goal
      (> 1 0)
      :precision precise :depth 1)
    )
    (goals
    (goal
      (> a 1)
      (> a (+ b 1))
      :precision precise :depth 1)
    )
    (goals
    (goal
      (> a 1)
      (< (+ b (* (- 1) a) 1) 0)
      :precision precise :depth 1)
    )
    (goals
    (goal
      (> a 1)
      (not (= a 0))
      (< (+ b (* (- 1) a) 1) 0)
      :precision precise :depth 1)
    )
---*)
