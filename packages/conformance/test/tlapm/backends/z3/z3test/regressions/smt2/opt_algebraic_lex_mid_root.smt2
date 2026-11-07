(*---
description: z3test's regression regressions/smt2/opt_algebraic_lex_mid_root.smt2.
ref: regressions/smt2/opt_algebraic_lex_mid_root.smt2
features:
  - z3test
outcome: sat
---*)
; lex: the first optimum is the middle root of x^3 - 3x + 1 (isolating interval
; between two neighbouring roots); the second objective inherits it through y <= x
(declare-const x Real)
(declare-const y Real)
(assert (>= (+ (* x x x) (* (- 3.0) x) 1.0) 0.0))
(assert (<= x 1.0))
(assert (<= y x))
(maximize x)
(maximize y)
(check-sat)
(get-objectives)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    (objectives
     (x (root-obj (+ (^ x 3) (* (- 3) x) 1) 2))
     (y (root-obj (+ (^ x 3) (* (- 3) x) 1) 2))
    )
---*)
