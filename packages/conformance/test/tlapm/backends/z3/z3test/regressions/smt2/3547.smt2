(*---
description: z3test's regression regressions/smt2/3547.smt2.
ref: regressions/smt2/3547.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :trace true)
(declare-fun a () Int)
(declare-fun b () Int)
(declare-fun c () Int)
(declare-fun d () Int)
(declare-fun e () String)
(assert (xor (< a 8 (* a b)) true (< (/ c d) (str.len e) a b)))
(assert (= "bef" (str.substr e c d)))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
