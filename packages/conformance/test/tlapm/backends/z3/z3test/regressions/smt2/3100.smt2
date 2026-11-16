(*---
description: z3test's regression regressions/smt2/3100.smt2.
ref: regressions/smt2/3100.smt2
features:
  - z3test
outcome: sat
---*)
(set-logic QF_S)
(declare-fun E () String)
(assert (= (str.++  E "aa" E "ab" E)  (str.++  "a" E E "aabaa") ))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
