(*---
description: z3test's regression regressions/smt2/opt_nlsat_disabled.smt2.
ref: regressions/smt2/opt_nlsat_disabled.smt2
features:
  - z3test
outcome: unknown
---*)
; opt.optsmt_nlsat=false disables the nlsat-cell engine: the irrational optimum
; sqrt(2) is only bracketed by bisection (8 rounds)
(set-option :opt.optsmt_nlsat false)
(set-option :opt.optsmt_bisect_rounds 8)
(declare-const x Real)
(assert (<= (* x x) 2.0))
(maximize x)
(check-sat)
(get-objectives)

(*--- recorded
all:
  exit: 0
  transcript: |-
    unknown
    (objectives
     (x  (interval (/ 185363.0 131072.0) (/ 229157189.0 162037760.0)))
    )
---*)
