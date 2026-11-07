(*---
description: z3test's regression regressions/smt2/4041.smt2.
ref: regressions/smt2/4041.smt2
features:
  - z3test
outcome: unsat
---*)
(declare-fun a () String)
(declare-fun b () String)
(assert (distinct (str.substr (str.++ a "ab" b) 0 (+ (str.len a) 1)) (str.++ a "a")))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
