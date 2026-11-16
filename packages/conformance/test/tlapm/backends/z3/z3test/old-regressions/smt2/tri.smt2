(*---
description: z3test's regression old-regressions/smt2/tri.smt2.
ref: old-regressions/smt2/tri.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation


(declare-const a Real)

(echo "trigonometric...")
(display (sin a))
(display (cos a))
(display (tan a))
(display (asin a))
(display (acos a))
(display (atan a))

(echo "hyperbolic...")
(display (sinh a))
(display (cosh a))
(display (tanh a))
(display (asinh a))
(display (acosh a))
(display (atanh a))

(*--- recorded
all:
  exit: 0
  transcript: |-
    trigonometric...
    (sin a)
    (cos a)
    (tan a)
    (asin a)
    (acos a)
    (atan a)
    hyperbolic...
    (sinh a)
    (cosh a)
    (tanh a)
    (asinh a)
    (acosh a)
    (atanh a)
---*)
