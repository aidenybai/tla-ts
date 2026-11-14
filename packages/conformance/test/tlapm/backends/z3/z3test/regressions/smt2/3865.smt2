(*---
description: z3test's regression regressions/smt2/3865.smt2.
ref: regressions/smt2/3865.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :rewriter.flat false)
(set-option :model_validate true)
(declare-fun a () Int)
(declare-fun b (Int) Bool)
(declare-fun c (Int) Bool)
(push)
(assert (or (or (not (b a)) (not (c a))) (c a)))
(assert (c (- a 1)))
(assert (= (c 0) (b 0)))
(assert (b (mod a (- 1))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
