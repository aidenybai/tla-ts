(*---
description: z3test's regression regressions/smt2/opt_algebraic_bool_structure.smt2.
ref: regressions/smt2/opt_algebraic_bool_structure.smt2
features:
  - z3test
outcome: sat
---*)
; disjunction of two nonlinear regions: the optimum 5^(1/3) lies in the branch b = false
(declare-const x Real)
(declare-const b Bool)
(assert (or (and b (<= (* x x) 2.0)) (and (not b) (<= (* x x x) 5.0) (>= x 0.0))))
(maximize x)
(check-sat)
(get-objectives)
(get-value (x b))

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    (objectives
     (x (root-obj (+ (^ x 3) (- 5)) 1))
    )
    ((x (root-obj (+ (^ x 3) (- 5)) 1))
     (b false))
---*)
