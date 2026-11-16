(*---
description: z3test's regression regressions/smt2/t121.smt2.
ref: regressions/smt2/t121.smt2
features:
  - z3test
outcome: unsat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-logic QF_BV)
(set-info :status unsat)
(declare-const a (_ BitVec 4))
(declare-const b (_ BitVec 4))
(declare-const c Bool)
(declare-const d Bool)
;; make sure the simplifier doesn't catch it.
(assert (or d c))
(assert (or (not d) c))
(assert (=> c (= a #x0)))
(assert (=> c (= b #b1010)))
(assert (= (bvsmod a b) b))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
