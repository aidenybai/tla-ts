(*---
description: z3test's regression regressions/smt2/t211.smt2.
ref: regressions/smt2/t211.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation

(set-option :pp.decimal true)
(declare-const x Real)
(declare-const y Real)

(simplify (- 3.0 (^ 2.0 (/ 1.0 2.0))))
(simplify (- (/ 1.0 3.0) (^ 2.0 (/ 1.0 2.0))))
(simplify (- (^ 3.0 (/ 1.0 2.0)) (^ 2.0 (/ 1.0 2.0))))
(simplify (- (^ 4.0 (/ 1.0 2.0)) (^ 2.0 (/ 1.0 2.0))))

(*--- recorded
all:
  exit: 0
  transcript: |-
    1.5857864376?
    (- 1.0808802290?)
    0.3178372451?
    0.5857864376?
---*)
