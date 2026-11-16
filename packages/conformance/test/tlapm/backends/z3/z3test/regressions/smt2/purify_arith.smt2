(*---
description: z3test's regression regressions/smt2/purify_arith.smt2.
ref: regressions/smt2/purify_arith.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-option :pp.max-depth 100)

(declare-const a Real)

(assert (forall ((x Int) (y Real)) (=> (= (mod x 3) 0) (= (/ y a) 0))))
(apply purify-arith)

(reset)

(assert (forall ((x Int)) (= (mod x 3) 0)))
(apply purify-arith)

(reset)

(assert (forall ((x Int)) (<= (+ (* x x 3) x) 2)))
(apply purify-arith)

(reset)

(declare-const a Real)
(declare-const b Real)

(assert (= (/ a b) 0))

(apply purify-arith)

(*--- recorded
all:
  exit: 0
  transcript: |-
    (goals
    (goal
      (forall ((x Int) (y Real)) (or (not (= (mod x 3) 0)) (= (/ y a) 0.0)))
      :precision precise :depth 4)
    )
    (goals
    (goal
      (forall ((x Int)) (= (mod x 3) 0))
      :precision precise :depth 4)
    )
    (goals
    (goal
      (forall ((x Int)) (<= (+ (* 3 x x) x) 2))
      :precision precise :depth 4)
    )
    (goals
    (goal
      (= k!0 0.0)
      (or (= b 0.0) (= (* k!0 b) a))
      (or (not (= b 0.0)) (= k!0 (/ a 0.0)))
      :precision precise :depth 4)
    )
---*)
