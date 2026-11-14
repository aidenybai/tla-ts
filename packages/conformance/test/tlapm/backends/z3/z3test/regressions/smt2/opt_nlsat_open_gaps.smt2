(*---
description: z3test's regression regressions/smt2/opt_nlsat_open_gaps.smt2.
ref: regressions/smt2/opt_nlsat_open_gaps.smt2
features:
  - z3test
outcome: sat
---*)
; The feasible set below the unattained supremum sqrt(2) has five gaps
; accumulating toward it: each (x-a)(x-b) >= 0 removes the open interval
; (a,b), leaving ... u [1.4141, 1.4142] u [1.41421, 1.414213]
; u [1.4142135, sqrt(2)). The last sliver starts 6.2e-8 below the limit;
; the certificate must approach sqrt(2) inside it, across the gaps.
(declare-const x Real)
(assert (< (* x x) 2.0))
(assert (>= (* (- x 1.41) (- x 1.411)) 0.0))
(assert (>= (* (- x 1.413) (- x 1.4137)) 0.0))
(assert (>= (* (- x 1.414) (- x 1.4141)) 0.0))
(assert (>= (* (- x 1.4142) (- x 1.41421)) 0.0))
(assert (>= (* (- x 1.414213) (- x 1.4142135)) 0.0))
(maximize x)
(check-sat)
(get-objectives)

(reset)
; A moving witness through gaps: (1-x)*y = 1, y > 0 forces x < 1 with
; y -> oo as x -> 1, so sup(x) = 1 is unattained. Five gaps approach 1
; geometrically; feasible x near the limit lies in (0.999991, 1) where
; y must exceed 100000.
(set-option :opt.optsmt_nlsat_supremum_rlimit 1000000)
(declare-const x Real)
(declare-const y Real)
(assert (= (* (- 1.0 x) y) 1.0))
(assert (> y 0.0))
(assert (>= (* (- x 0.9) (- x 0.91)) 0.0))
(assert (>= (* (- x 0.99) (- x 0.991)) 0.0))
(assert (>= (* (- x 0.999) (- x 0.9991)) 0.0))
(assert (>= (* (- x 0.9999) (- x 0.99991)) 0.0))
(assert (>= (* (- x 0.99999) (- x 0.999991)) 0.0))
(maximize x)
(check-sat)
(get-objectives)

(reset)
; Gaps in x induced by y alone: y*(2-x^2) = 1, y > 0 forces x^2 < 2 with
; y = 1/(2-x^2) -> oo as x -> sqrt(2), and y is monotone in x for x > 0.
; Removing y in (10,11), ..., (100000,110000) removes the x bands
; (sqrt(2-1/10), sqrt(2-1/11)), ..., (sqrt(2-1/100000), sqrt(2-1/110000)):
; five gaps accumulating at the unattained supremum sqrt(2), none of them
; visible in a constraint over x.
(set-option :opt.optsmt_nlsat_supremum_rlimit 1000000)
(declare-const x Real)
(declare-const y Real)
(assert (= (* y (- 2.0 (* x x))) 1.0))
(assert (> y 0.0))
(assert (>= (* (- y 10.0) (- y 11.0)) 0.0))
(assert (>= (* (- y 100.0) (- y 110.0)) 0.0))
(assert (>= (* (- y 1000.0) (- y 1100.0)) 0.0))
(assert (>= (* (- y 10000.0) (- y 11000.0)) 0.0))
(assert (>= (* (- y 100000.0) (- y 110000.0)) 0.0))
(maximize x)
(check-sat)
(get-objectives)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    (objectives
     (x (+ (root-obj (+ (^ x 2) (- 2)) 2) (* (- 1.0) epsilon)))
    )
    sat
    (objectives
     (x (+ 1.0 (* (- 1.0) epsilon)))
    )
    sat
    (objectives
     (x (+ (root-obj (+ (^ x 2) (- 2)) 2) (* (- 1.0) epsilon)))
    )
---*)
