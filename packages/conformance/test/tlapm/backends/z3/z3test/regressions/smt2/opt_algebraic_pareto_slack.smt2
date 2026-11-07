(*---
description: z3test's regression regressions/smt2/opt_algebraic_pareto_slack.smt2.
ref: regressions/smt2/opt_algebraic_pareto_slack.smt2
features:
  - z3test
outcome: sat
---*)
; two Pareto points whose coordinates differ by 10^-14: (sqrt2, sqrt3 - 10^-14)
; and (sqrt2 - 10^-14, sqrt3). They are incomparable, so both are on the front
; and the third check-sat is unsat. The nlsat-backed pareto solver compares
; each objective against its exact algebraic model value; a comparison rounded
; to 12 decimal digits blocks each point by the other and cuts the front to a
; single point, answering sat/unsat/sat.
(set-option :opt.priority pareto)
(declare-const x Real)
(declare-const w Real)
(declare-const r2 Real)
(declare-const r3 Real)
(assert (= (* r2 r2) 2))
(assert (> r2 0))
(assert (= (* r3 r3) 3))
(assert (> r3 0))
(assert (or (and (= x r2) (= w (- r3 (/ 1 100000000000000))))
            (and (= x (- r2 (/ 1 100000000000000))) (= w r3))))
(maximize x)
(maximize w)
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
     (w  (interval (/ 108253175473.0 62500000000.0) (/ 1732050807569.0 1000000000000.0)))
    )
    sat
    (objectives
     (x  (interval (/ 1414213562373.0 1000000000000.0) (/ 707106781187.0 500000000000.0)))
     (w  (interval (/ 108253175473.0 62500000000.0) (/ 1732050807569.0 1000000000000.0)))
    )
    unsat
---*)
