(*---
description: z3test's regression old-regressions/smt2/t275.smt2.
ref: old-regressions/smt2/t275.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation


(declare-const a Real)
(declare-const b Real)

(assert (>= (* 2.0 a) (+ (* 3.0 b) 5.0)))

(apply (when (> num-arith-consts 2) (! simplify :arith-lhs true)))
(apply (when (= num-arith-consts 2) (! simplify :arith-lhs true)))

(*--- recorded
all:
  exit: 0
  transcript: |-
    (goals
    (goal
      (>= (* 2.0 a) (+ (* 3.0 b) 5.0))
      :precision precise :depth 0)
    )
    (goals
    (goal
      (>= (+ (* 2.0 a) (* (- 3.0) b)) 5.0)
      :precision precise :depth 1)
    )
---*)
