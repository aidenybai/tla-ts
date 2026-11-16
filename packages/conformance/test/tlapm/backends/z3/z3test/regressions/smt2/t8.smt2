(*---
description: z3test's regression regressions/smt2/t8.smt2.
ref: regressions/smt2/t8.smt2
features:
  - z3test
outcome: unsat
---*)

; Copyright (c) 2015 Microsoft Corporation




(declare-const s1 (Array Int Bool))
(declare-const s2 (Array Int Bool))

(set-info :status unsat)

(assert (not (= ((_ map and) s1 s2)
                ((_ map not) ((_ map or) ((_ map not) s1) ((_ map not) s2))))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
