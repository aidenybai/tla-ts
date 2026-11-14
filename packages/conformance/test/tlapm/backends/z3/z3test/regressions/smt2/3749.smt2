(*---
description: z3test's regression regressions/smt2/3749.smt2.
ref: regressions/smt2/3749.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :smt.arith.solver 6)
(set-option :rewriter.flat false)
(declare-fun a () Int)
(declare-fun b () Int)
(declare-fun c () Int)
(declare-fun d () Int)
(assert (= 0 (div c b (- a d (- a d)))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
