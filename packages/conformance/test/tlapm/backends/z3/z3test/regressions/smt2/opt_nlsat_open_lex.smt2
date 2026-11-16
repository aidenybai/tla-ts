(*---
description: z3test's regression regressions/smt2/opt_nlsat_open_lex.smt2.
ref: regressions/smt2/opt_nlsat_open_lex.smt2
features:
  - z3test
outcome: unknown
---*)
; Fixing x to sqrt(2) would violate x^2<2. Do not falsely report an
; optimal lexicographic model when a later objective still needs solving.
(declare-const x Real)
(declare-const y Real)
(assert (< (* x x) 2.0))
(assert (<= y 3.0))
(maximize x)
(maximize y)
(check-sat)
(get-info :reason-unknown)
(get-objectives)

(reset)
; The last lex objective can have an open limit: no later commitment is needed.
(declare-const x Real)
(declare-const y Real)
(assert (< (* x x) 2.0))
(assert (<= y 3.0))
(maximize y)
(maximize x)
(check-sat)
(get-objectives)

(reset)
; Keep an attained algebraic first objective, then certify the open second limit.
(set-option :opt.optsmt_nlsat_supremum_rlimit 1000000)
(declare-const x Real)
(declare-const y Real)
(assert (<= (* x x) 2.0))
(assert (< (+ (* x x) (* y y)) 4.0))
(maximize x)
(maximize y)
(check-sat)
(get-objectives)

(*--- recorded
all:
  exit: 0
  transcript: |-
    unknown
    (:reason-unknown "later lexicographic objectives after an unattained nonlinear optimum are not supported")
    (objectives
     (x (+ (root-obj (+ (^ x 2) (- 2)) 2) (* (- 1.0) epsilon)))
     (y  (interval (* (- 1) oo) oo))
    )
    sat
    (objectives
     (y 3)
     (x (+ (root-obj (+ (^ x 2) (- 2)) 2) (* (- 1.0) epsilon)))
    )
    sat
    (objectives
     (x (root-obj (+ (^ x 2) (- 2)) 2))
     (y (+ (root-obj (+ (^ x 2) (- 2)) 2) (* (- 1.0) epsilon)))
    )
---*)
