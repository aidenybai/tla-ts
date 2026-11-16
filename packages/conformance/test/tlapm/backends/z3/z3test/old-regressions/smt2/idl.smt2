(*---
description: z3test's regression old-regressions/smt2/idl.smt2.
ref: old-regressions/smt2/idl.smt2
features:
  - z3test
outcome: sat
---*)

; Copyright (c) 2015 Microsoft Corporation

(set-option :auto-config true)
(declare-const a Int)
(declare-const b Int)

(assert 
 (>= (- a (ite (<= a 0) (* 3 b) b)) 2)
)

(check-sat)

(eval (>= (- a (ite (<= a 0) (* 3 b) b)) 2))

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    true
---*)
