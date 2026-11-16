(*---
description: z3test's regression regressions/smt2/issue2301.smt2.
ref: regressions/smt2/issue2301.smt2
features:
  - z3test
outcome: sat
---*)

(set-info :status sat)
(declare-fun tmp_int2 () Int)
(assert
 (= (str.indexof "" "" tmp_int2) (- 1)))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
