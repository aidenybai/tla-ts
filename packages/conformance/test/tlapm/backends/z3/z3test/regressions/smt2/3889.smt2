(*---
description: z3test's regression regressions/smt2/3889.smt2.
ref: regressions/smt2/3889.smt2
features:
  - z3test
outcome: sat
---*)
(declare-fun a () String)
(declare-fun b () Int)
(declare-fun c () Int)
(declare-fun d () Int)
(declare-fun e (Int) Bool)
(declare-fun f () Int)
(assert (xor (> c 0) (< (/ 1 b c) (str.len a))))
(assert (e f))
(assert (distinct "efg" (str.substr a b c)))
(assert (= "bef" (str.substr a f d)))
(assert (> (str.len a) 10))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
