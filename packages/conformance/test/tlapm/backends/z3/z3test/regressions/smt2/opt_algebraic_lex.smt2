(*---
description: z3test's regression regressions/smt2/opt_algebraic_lex.smt2.
ref: regressions/smt2/opt_algebraic_lex.smt2
features:
  - z3test
outcome: sat
---*)
; lex: maximize x (= sqrt(2)), then maximize y under x*y <= 1 (= 1/sqrt(2)); the first optimum is committed exactly
(declare-const x Real)
(declare-const y Real)
(assert (<= (* x x) 2.0))
(assert (<= (* x y) 1.0))
(assert (>= y 0.0))
(maximize x)
(maximize y)
(check-sat)
(get-objectives)
(get-value (x y))

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    (objectives
     (x (root-obj (+ (^ x 2) (- 2)) 2))
     (y (root-obj (+ (* 2 (^ x 2)) (- 1)) 2))
    )
    ((x (root-obj (+ (^ x 2) (- 2)) 2))
     (y (root-obj (+ (* 2 (^ x 2)) (- 1)) 2)))
---*)
