(*---
description: z3test's regression regressions/smt2/3705.smt2.
ref: regressions/smt2/3705.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :smt.quasi_macros true)
(declare-sort a)
(declare-sort b)
(declare-sort c)
(declare-fun d (a) b)
(declare-fun k () c)
(declare-fun i () c)
(declare-fun e (b) a)
(declare-fun f (b) a)
(declare-fun j (b b) Bool)
(assert (forall ((g a)) (let ((h (d g))) (j (d (e h)) h))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
