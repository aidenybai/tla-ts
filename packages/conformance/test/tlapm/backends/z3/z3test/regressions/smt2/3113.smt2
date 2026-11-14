(*---
description: z3test's regression regressions/smt2/3113.smt2.
ref: regressions/smt2/3113.smt2
features:
  - z3test
outcome: sat
---*)
(declare-rel f ((Array Int Int)))
(declare-var a (Array Int Int))
(rule (f a))
(query f)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
