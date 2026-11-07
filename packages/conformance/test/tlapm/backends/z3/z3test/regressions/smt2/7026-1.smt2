(*---
description: z3test's regression regressions/smt2/7026-1.smt2.
ref: regressions/smt2/7026-1.smt2
features:
  - z3test
outcome: unsat
---*)
(set-option :tactic.default_tactic smt)
(set-option :sat.euf true)
(set-info :status unsat)

(declare-fun a () Float32)
(assert (forall ((b Float32)) (not (fp.isPositive (fp.max a b)))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
