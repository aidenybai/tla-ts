(*---
description: z3test's regression old-regressions/smt2/t278.smt2.
ref: old-regressions/smt2/t278.smt2
features:
  - z3test
outcome: sat
---*)

; Copyright (c) 2015 Microsoft Corporation
(declare-const a Int)
(declare-const b Int)
(assert (not (= (store (store ((as const (Array Int Int)) 1) 1 a) 2 b) 
                  (store ((as const (Array Int Int)) 1) 1 a))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
