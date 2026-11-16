(*---
description: z3test's regression old-regressions/smt2/t36.smt2.
ref: old-regressions/smt2/t36.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation
(declare-const a Int)
(declare-const b Int)
(declare-const c Int)
(declare-const d Int)
(declare-const r1 Real)
(declare-const r2 Real)
(set-option :pp.flat-assoc false)


(simplify (- 0 a))
(simplify (+ 0 a))
(simplify (+ a 0))
(simplify (to_int 2.1))
(simplify (to_real 1))
(simplify (to_int (to_real 1)))
(simplify (to_int (to_real a)))
(simplify (to_real (to_int r1)))
(simplify (is_int r1))
(simplify (is_int 2.0))
(simplify (is_int 2.1))
(simplify (is_int (to_real a)))

(*--- recorded
all:
  exit: 0
  transcript: |-
    (* (- 1) a)
    a
    a
    2
    1.0
    1
    a
    (to_real (to_int r1))
    (= (to_real (to_int r1)) r1)
    true
    false
    true
---*)
