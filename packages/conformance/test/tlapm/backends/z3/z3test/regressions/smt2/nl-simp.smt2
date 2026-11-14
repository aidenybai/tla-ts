(*---
description: z3test's regression regressions/smt2/nl-simp.smt2.
ref: regressions/smt2/nl-simp.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation

(simplify (not (= (root-obj (+ (* 64 (^ x 2)) (- 65)) 2) 0.0)))

(simplify (= (root-obj (+ (* 64 (^ x 2)) (- 65)) 2) 0.0))

(check-sat)

(eval (not (= (root-obj (+ (* 64 (^ x 2)) (- 65)) 2) 0.0)))

(eval (= (root-obj (+ (* 64 (^ x 2)) (- 65)) 2) 0.0))

(*--- recorded
all:
  exit: 0
  transcript: |-
    true
    false
    sat
    true
    false
---*)
