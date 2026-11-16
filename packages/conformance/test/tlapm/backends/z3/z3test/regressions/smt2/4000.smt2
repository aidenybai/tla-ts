(*---
description: z3test's regression regressions/smt2/4000.smt2.
ref: regressions/smt2/4000.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :proof true)
(declare-const Str8 String)
(declare-const Str13 String)
(assert (>= (str.len (str.++ Str13 (str.++ Str8 ""))) 13))
(assert true)
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
