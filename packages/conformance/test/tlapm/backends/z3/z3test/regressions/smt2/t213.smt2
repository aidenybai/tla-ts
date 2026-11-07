(*---
description: z3test's regression regressions/smt2/t213.smt2.
ref: regressions/smt2/t213.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation

(set-option :pp.decimal true)
(declare-const x Real)
(declare-const y Real)

(simplify (/ 1.0 (^ 2.0 (/ 1.0 2.0))))
(simplify (/ 3.0 (^ 2.0 (/ 1.0 2.0))))
(simplify (/ (^ 2.0 (/ 1.0 2.0)) 3.0))
(simplify (= (/ 1.0 (^ 2.0 (/ 1.0 2.0)))
             (/ (^ 2.0 (/ 1.0 2.0)) 2.0)))
(simplify (/ (^ 2.0 (/ 1.0 2.0)) (^ 3.0 (/ 1.0 2.0))))
(simplify (/ (^ 2.0 (/ 1.0 2.0)) 0.0))
(simplify (/ (^ 2.0 (/ 1.0 2.0)) 1.0))

(*--- recorded
all:
  exit: 0
  transcript: |-
    0.7071067811?
    2.1213203435?
    0.4714045207?
    true
    0.8164965809?
    (/ 1.4142135623? 0.0)
    1.4142135623?
---*)
