(*---
description: z3test's regression regressions/smt2/6319.smt2.
ref: regressions/smt2/6319.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :sat.euf true)
(set-option :tactic.default_tactic smt)
(assert (distinct (_ bv1 1) (_ bv0 1)))
(check-sat)
(reset)


(set-option :sat.euf true)
(set-option :tactic.default_tactic smt)
(assert (distinct false true))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    sat
---*)
