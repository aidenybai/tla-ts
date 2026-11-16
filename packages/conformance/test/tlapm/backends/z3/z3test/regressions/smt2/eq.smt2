(*---
description: z3test's regression regressions/smt2/eq.smt2.
ref: regressions/smt2/eq.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation


(declare-const a Int)
(declare-fun f (Int) Int)
(simplify (f f))
(simplify (a + 1))
(assert (a = 1))

(*--- recorded
all:
  exit: 0
  transcript: |-
    (error "line 7 column 14: unknown constant f ((Array Int Int)) 
    declared: (declare-fun f (Int) Int) ")
    (error "line 8 column 13: no arguments supplied to arithmetical operator")
    (error "line 9 column 11: unknown constant =")
---*)
