(*---
description: z3test's regression regressions/smt2/opt_nlsat_uf_fallback.smt2.
ref: regressions/smt2/opt_nlsat_uf_fallback.smt2
features:
  - z3test
outcome: unknown
---*)
; an uninterpreted function puts the problem outside the nlsat fragment:
; the nlsat-cell engine declines and the objective falls back to bisection
(declare-const x Real)
(declare-fun f (Real) Real)
(assert (<= (* x x) 2.0))
(assert (<= (f x) 5.0))
(maximize x)
(check-sat)
(get-objectives)

(*--- recorded
all:
  exit: 0
  transcript: |-
    unknown
    (objectives
     (x  (interval (/ 208701085205324515397.0 147573952589676412928.0) (/ 417402170410709805943.0 295147905179352825856.0)))
    )
---*)
