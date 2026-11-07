(*---
description: z3test's regression regressions/smt2/opt_algebraic_pareto_front.smt2.
ref: regressions/smt2/opt_algebraic_pareto_front.smt2
features:
  - z3test
outcome: sat
---*)
; pareto front with irrational coordinates: x^2 = 2, y = -x has exactly the two
; incomparable points (sqrt2, -sqrt2) and (-sqrt2, sqrt2); the third check-sat
; exhausts the front. The problem is pure NRA, so the loop runs on the
; nlsat-backed pareto solver and the dominance constraints compare each
; objective against its exact algebraic model value; the reported intervals
; are 12-decimal-digit brackets of those values.
(set-option :opt.priority pareto)
(declare-const x Real)
(declare-const y Real)
(assert (= (* x x) 2))
(assert (= y (- x)))
(maximize x)
(maximize y)
(check-sat)
(get-objectives)
(check-sat)
(get-objectives)
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    (objectives
     (x  (interval (/ 1414213562373.0 1000000000000.0) (/ 707106781187.0 500000000000.0)))
     (y  (interval (- (/ 707106781187.0 500000000000.0)) (- (/ 1414213562373.0 1000000000000.0))))
    )
    sat
    (objectives
     (x  (interval (- (/ 707106781187.0 500000000000.0)) (- (/ 1414213562373.0 1000000000000.0))))
     (y  (interval (/ 1414213562373.0 1000000000000.0) (/ 707106781187.0 500000000000.0)))
    )
    unsat
---*)
