(*---
description: z3test's regression regressions/smt2/4015.smt2.
ref: regressions/smt2/4015.smt2
features:
  - z3test
outcome: sat
---*)
(declare-fun a () String)
(declare-fun b () String)
(set-option :smt.random_seed 6) 
(assert (distinct (str.contains (str.replace "B" a b) b) (str.prefixof a (str.replace "" b a))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
