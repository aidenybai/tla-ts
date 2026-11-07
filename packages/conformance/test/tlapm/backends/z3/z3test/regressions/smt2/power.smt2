(*---
description: z3test's regression regressions/smt2/power.smt2.
ref: regressions/smt2/power.smt2
features:
  - z3test
outcome: any
---*)
(declare-const a Int)
(declare-const b Int)

(simplify (<= (+ (* a a) (* b b b)) -1))
(simplify (<= (+ (* a a) (* b b b b)) -1))
(simplify (<= (+ (* a a) (* b b b b)) 0))
(simplify (>= (+ (* -1 a a) (* -2 b b)) 1))
(simplify (>= (+ (* -1 a a) (* -2 b b)) 0))

(*--- recorded
all:
  exit: 0
  transcript: |-
    (<= (+ (* a a) (* b b b)) (- 1))
    false
    (and (= a 0) (= b 0))
    false
    (and (= a 0) (= b 0))
---*)
