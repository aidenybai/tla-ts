(*---
description: z3test's regression regressions/smt2/opt_nlsat_open_budget.smt2.
ref: regressions/smt2/opt_nlsat_open_budget.smt2
features:
  - z3test
outcome: unknown
---*)
; With certification disabled or its budget exhausted, report a sound interval.
; A sufficient budget certifies the open bound on the same optimizer.
(set-option :opt.optsmt_bisect_rounds 8)
(set-option :opt.optsmt_nlsat_supremum_rlimit 0)
(declare-const x Real)
(assert (< (* x x) 2.0))
(maximize x)
(check-sat)
(get-objectives)
(set-option :opt.optsmt_nlsat_supremum_rlimit 1)
(check-sat)
(get-objectives)
(set-option :opt.optsmt_nlsat_supremum_rlimit 100000)
(check-sat)
(get-objectives)

; Adding x<=1 must replace the previous sqrt(2)-epsilon bound with the
; attained maximum 1, without retaining the old algebraic value or epsilon.
(push)
(assert (<= x 1.0))
(check-sat)
(get-objectives)
; Removing the cap must restore the open sqrt(2)-epsilon bound.
(pop)
(check-sat)
(get-objectives)

(*--- recorded
all:
  exit: 0
  transcript: |-
    unknown
    (objectives
     (x  (interval (/ 741455.0 524288.0) (/ 4133750873887694826665497936027618045008388391659.0
       2923003274661805836407369665432566039311865085952.0)))
    )
    unknown
    (objectives
     (x  (interval (/ 741455.0 524288.0) (/ 4133750873887694826665497936027618045008388391659.0
       2923003274661805836407369665432566039311865085952.0)))
    )
    sat
    (objectives
     (x (+ (root-obj (+ (^ x 2) (- 2)) 2) (* (- 1.0) epsilon)))
    )
    sat
    (objectives
     (x 1)
    )
    sat
    (objectives
     (x (+ (root-obj (+ (^ x 2) (- 2)) 2) (* (- 1.0) epsilon)))
    )
---*)
