(*---
description: z3test's regression regressions/smt2/issue-963.smt2.
ref: regressions/smt2/issue-963.smt2
features:
  - z3test
outcome: unsat
---*)

(declare-fun c2 () Int)

(assert (<= 0 c2))
(assert (<= c2 8))
(assert (not (<= 0 (str.indexof "a123cdef" (str.substr "a123cdef" 0 c2) 0))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
