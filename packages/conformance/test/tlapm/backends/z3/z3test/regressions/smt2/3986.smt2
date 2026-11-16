(*---
description: z3test's regression regressions/smt2/3986.smt2.
ref: regressions/smt2/3986.smt2
features:
  - z3test
outcome: sat
---*)
(set-logic NRA)
(assert (! (distinct 0.0 8.0 8.0 0.6 837.0) :named IP_12))
(reset-assertions)
(check-sat)
(assert (! (exists ((q4 Real)) (distinct q4 72.0)) :named IP_13))

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
