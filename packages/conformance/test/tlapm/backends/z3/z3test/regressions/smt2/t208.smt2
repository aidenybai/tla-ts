(*---
description: z3test's regression regressions/smt2/t208.smt2.
ref: regressions/smt2/t208.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation

(set-option :pp.decimal true)

(simplify (^ 2.0 (/ 1.0 2.0)))
(simplify (^ (^ 2.0 (/ 1.0 2.0)) (/ 1.0 3.0)))

(set-option :pp.decimal-precision 30)
(simplify (^ (^ 2.0 (/ 1.0 2.0)) (/ 1.0 3.0)))

(simplify (^ 5.0 (/ 1.0 3.0)))

(*--- recorded
all:
  exit: 0
  transcript: |-
    1.4142135623?
    1.1224620483?
    1.122462048309372981433533049679?
    1.709975946676696989353108872543?
---*)
