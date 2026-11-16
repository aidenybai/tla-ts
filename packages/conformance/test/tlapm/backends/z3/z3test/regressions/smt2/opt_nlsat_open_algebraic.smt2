(*---
description: z3test's regression regressions/smt2/opt_nlsat_open_algebraic.smt2.
ref: regressions/smt2/opt_nlsat_open_algebraic.smt2
features:
  - z3test
outcome: sat
---*)
; A positive irrational infimum: sqrt(2) + epsilon.
(declare-const x Real)
(assert (> (* x x) 2.0))
(assert (> x 0.0))
(minimize x)
(check-sat)
(get-objectives)

(reset)
; A negative irrational supremum: -sqrt(2) - epsilon.
(declare-const x Real)
(assert (> (* x x) 2.0))
(assert (< x 0.0))
(maximize x)
(check-sat)
(get-objectives)

(reset)
; For x*x<2, 2*x+3 approaches 3+2*sqrt(2) from below.
(declare-const x Real)
(assert (< (* x x) 2.0))
(maximize (+ (* 2.0 x) 3.0))
(check-sat)
(get-objectives)

(reset)
; A non-quadratic algebraic limit: cubert(2) - epsilon.
(declare-const x Real)
(assert (< (* x x x) 2.0))
(maximize x)
(check-sat)
(get-objectives)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    (objectives
     (x (+ (root-obj (+ (^ x 2) (- 2)) 2) epsilon))
    )
    sat
    (objectives
     (x (+ (root-obj (+ (^ x 2) (- 2)) 1) (* (- 1.0) epsilon)))
    )
    sat
    (objectives
     ((+ (* 2.0 x) 3.0) (+ (root-obj (+ (^ x 2) (* (- 6) x) 1) 2) (* (- 1.0) epsilon)))
    )
    sat
    (objectives
     (x (+ (root-obj (+ (^ x 3) (- 2)) 1) (* (- 1.0) epsilon)))
    )
---*)
