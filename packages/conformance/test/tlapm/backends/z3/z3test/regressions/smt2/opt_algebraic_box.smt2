(*---
description: z3test's regression regressions/smt2/opt_algebraic_box.smt2.
ref: regressions/smt2/opt_algebraic_box.smt2
features:
  - z3test
outcome: sat
---*)
; box: two independent algebraic optima sqrt(2) and sqrt(3)
(set-option :opt.priority box)
(declare-const x Real)
(declare-const y Real)
(assert (<= (* x x) 2.0))
(assert (<= (* y y) 3.0))
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
     (x (root-obj (+ (^ x 2) (- 2)) 2))
     (y (root-obj (+ (^ x 2) (- 3)) 2))
    )
---*)
