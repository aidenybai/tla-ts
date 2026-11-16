(*---
description: z3test's regression regressions/smt2/2561.smt2.
ref: regressions/smt2/2561.smt2
features:
  - z3test
outcome: sat
---*)
(declare-const v Bool)
(assert (= v (= 0.0 (/ 1.0 0.0))))
(check-sat)
(get-model)
(eval v)
(exit)

(declare-const v Bool)
(declare-const w Bool)
(declare-const r Real)
(declare-const x Real)
(declare-const y Real)

(assert (> x (/ 1.0 0.0)))
(assert (= y (/ 2.0 0.0)))
(assert (= y (/ 3.0 0.0)))
(assert (= v (= 0.0 (/ 1.0 0.0))))
(assert (= w (= 0.0 (/ 1.0 r))))
(check-sat)
(eval v)
(eval w)
(eval (/ 1.0 0.0))
(eval x)
(get-model)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    (
      (define-fun v () Bool
        true)
    )
    true
---*)
