(*---
description: z3test's regression regressions/smt2/3223.smt2.
ref: regressions/smt2/3223.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :proof true)
(declare-fun a () Real)
(declare-fun b () Real)
(declare-fun c () Real)
(declare-fun d () Real)
(declare-fun e () Real)
(assert (forall ((f Real)) (and (or (and (> d (/ 0 b)) (= c 0)) (<= e 0)) (= d a))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
