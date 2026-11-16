(*---
description: z3test's regression regressions/smt2/bvsmod.smt2.
ref: regressions/smt2/bvsmod.smt2
features:
  - z3test
outcome: unsat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-option :auto-config true)
(declare-const v0 (_ BitVec 2))
(assert (not (= (bvsmod v0 (_ bv1 2)) (_ bv0 2))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
