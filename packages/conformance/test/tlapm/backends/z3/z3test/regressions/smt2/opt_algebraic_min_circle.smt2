(*---
description: z3test's regression regressions/smt2/opt_algebraic_min_circle.smt2.
ref: regressions/smt2/opt_algebraic_min_circle.smt2
features:
  - z3test
outcome: sat
---*)
; minimize x+y on the unit circle (OCAC, AAAI'25, Example 1): optimum -sqrt(2), model x = y = -1/sqrt(2)
(declare-const x Real)
(declare-const y Real)
(assert (= (+ (* x x) (* y y)) 1.0))
(minimize (+ x y))
(check-sat)
(get-objectives)
(get-model)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    (objectives
     ((+ x y) (root-obj (+ (^ x 2) (- 2)) 1))
    )
    (
      (define-fun x () Real
        (root-obj (+ (* 2 (^ x 2)) (- 1)) 1))
      (define-fun y () Real
        (root-obj (+ (* 2 (^ x 2)) (- 1)) 1))
    )
---*)
