(*---
description: z3test's regression regressions/smt2/t215.smt2.
ref: regressions/smt2/t215.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation

(set-option :pp.decimal true)
(declare-const x Real)
(declare-const y Real)

(simplify (+ (^ 7.0 (/ 2.0 3.0)) (^ 22.0 (/ 3.0 5.0))))
(simplify (^ (+ (^ 7.0 (/ 2.0 3.0)) (^ 22.0 (/ 3.0 5.0))) (/ 1.0 3.0)))

(set-option :pp.decimal-precision 50)
(simplify (^ (+ (^ 7.0 (/ 2.0 3.0)) (^ 22.0 (/ 3.0 5.0))) (/ 1.0 3.0)))

(*--- recorded
all:
  exit: 0
  transcript: |-
    10.0486105390?
    2.1579199897?
    2.15791998975893902500164027371407657885210427329644?
---*)
