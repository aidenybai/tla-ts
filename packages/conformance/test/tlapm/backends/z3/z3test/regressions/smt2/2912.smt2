(*---
description: z3test's regression regressions/smt2/2912.smt2.
ref: regressions/smt2/2912.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :model_validate true)
(declare-fun a () String)
(declare-fun b () Int)
(assert (= b (+ (str.indexof a "x" 0) 1)))
(assert (str.contains (str.substr a b (* (str.len a) b)) "y"))
(assert (str.contains (str.replace (str.substr a 0 1) "x" "") "z"))
(assert (str.contains a "x"))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
