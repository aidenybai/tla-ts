(*---
description: z3test's regression old-regressions/smt2/tri2.smt2.
ref: old-regressions/smt2/tri2.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation
(declare-const a Real)

(echo "trigonometric...")
(simplify (sin (asin a)))
(simplify (cos (asin a)))
(simplify (cos (acos a)))
(simplify (tan (atan a)))

(echo "hyperbolic...")
(simplify (sinh (asinh a)))
(simplify (cosh (asinh a)))
(simplify (cosh (acosh a)))
(simplify (tanh (atanh a)))
(simplify (sinh (- a)))
(simplify (cosh (- a)))
(simplify (tanh (- a)))

(*--- recorded
all:
  exit: 0
  transcript: |-
    trigonometric...
    a
    (cos (asin a))
    a
    a
    hyperbolic...
    a
    (cosh (asinh a))
    a
    a
    (* (- 1.0) (sinh a))
    (cosh a)
    (* (- 1.0) (tanh a))
---*)
