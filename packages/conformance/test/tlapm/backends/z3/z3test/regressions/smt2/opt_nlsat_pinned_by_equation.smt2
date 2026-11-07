(*---
description: z3test's regression regressions/smt2/opt_nlsat_pinned_by_equation.smt2.
ref: regressions/smt2/opt_nlsat_pinned_by_equation.smt2
features:
  - z3test
outcome: sat
---*)
; maximize y s.t. x^2 = 2 /\ x >= 1 /\ x*y = 1: the objective is pinned to the
; single algebraic value y = 1/sqrt(2). The model value of the objective is an
; irrational algebraic number, which used to be dropped when updating the
; objective floor (only rational numerals were accepted), so the optimizer
; reported -oo for this satisfiable objective. The floor now uses a rational
; lower bound of the algebraic value and the nlsat fallback recovers the
; exact optimum.
(declare-const x Real)
(declare-const y Real)
(assert (= (* x x) 2.0))
(assert (>= x 1.0))
(assert (= (* x y) 1.0))
(maximize y)
(check-sat)
(get-objectives)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    (objectives
     (y (root-obj (+ (* 2 (^ x 2)) (- 1)) 2))
    )
---*)
