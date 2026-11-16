(*---
description: z3test's regression regressions/smt2/cosine7.smt2.
ref: regressions/smt2/cosine7.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation

(set-option :numeral-as-real true)
(declare-const x Real)
(declare-const y Real)
(declare-const z Real)

(simplify (cos (+ x (* 2 pi) y (* 2 pi z))))
(simplify (cos (+ x (* 2 pi) y (* 4 pi z))))
(simplify (cos (+ x (* 2 pi) y (* pi z))))

(*--- recorded
all:
  exit: 0
  transcript: |-
    (cos (+ x y (* 2.0 pi z)))
    (cos (+ x y (* 4.0 pi z)))
    (cos (+ x y (* pi z)))
---*)
