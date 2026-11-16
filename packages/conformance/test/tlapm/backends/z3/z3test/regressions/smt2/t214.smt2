(*---
description: z3test's regression regressions/smt2/t214.smt2.
ref: regressions/smt2/t214.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation

(set-option :pp.decimal true)
(declare-const x Real)
(declare-const y Real)

(simplify (< (^ 2.0 (/ 1.0 2.0)) 2.0))
(simplify (<= (^ 2.0 (/ 1.0 2.0)) 2.0))
(simplify (>= (^ 2.0 (/ 1.0 2.0)) 2.0))
(simplify (> (^ 2.0 (/ 1.0 2.0)) 2.0))
(simplify (= (^ 2.0 (/ 1.0 2.0)) 2.0))
(echo "------")
(simplify (< (^ 5.0 (/ 1.0 2.0)) 2.0))
(simplify (<= (^ 5.0 (/ 1.0 2.0)) 2.0))
(simplify (>= (^ 5.0 (/ 1.0 2.0)) 2.0))
(simplify (> (^ 5.0 (/ 1.0 2.0)) 2.0))
(simplify (= (^ 5.0 (/ 1.0 2.0)) 2.0))
(echo "------")
(simplify (< 2.0 (^ 2.0 (/ 1.0 2.0))))
(simplify (<= 2.0 (^ 2.0 (/ 1.0 2.0))))
(simplify (> 2.0 (^ 2.0 (/ 1.0 2.0))))
(simplify (>= 2.0 (^ 2.0 (/ 1.0 2.0))))
(simplify (= 2.0 (^ 2.0 (/ 1.0 2.0))))
(echo "------")
(simplify (< 2.0 (^ 5.0 (/ 1.0 2.0))))
(simplify (<= 2.0 (^ 5.0 (/ 1.0 2.0))))
(simplify (> 2.0 (^ 5.0 (/ 1.0 2.0))))
(simplify (>= 2.0 (^ 5.0 (/ 1.0 2.0))))
(simplify (= 2.0 (^ 5.0 (/ 1.0 2.0))))
(echo "------")
(simplify (< (^ 2.0 (/ 1.0 2.0)) (^ 5.0 (/ 1.0 2.0))))
(simplify (<= (^ 2.0 (/ 1.0 2.0)) (^ 5.0 (/ 1.0 2.0))))
(simplify (> (^ 2.0 (/ 1.0 2.0)) (^ 5.0 (/ 1.0 2.0))))
(simplify (>= (^ 2.0 (/ 1.0 2.0)) (^ 5.0 (/ 1.0 2.0))))
(simplify (= (^ 2.0 (/ 1.0 2.0)) (^ 5.0 (/ 1.0 2.0))))
(echo "------")
(simplify (^ 2.0 (/ 1.0 2.0)))
(simplify (= 1.4142135623 (^ 2.0 (/ 1.0 2.0))))
(simplify (> 1.4142135623 (^ 2.0 (/ 1.0 2.0))))
(simplify (< 1.4142135623 (^ 2.0 (/ 1.0 2.0))))

(*--- recorded
all:
  exit: 0
  transcript: |-
    true
    true
    false
    false
    false
    ------
    false
    false
    true
    true
    false
    ------
    false
    false
    true
    true
    false
    ------
    true
    true
    false
    false
    false
    ------
    true
    true
    false
    false
    false
    ------
    1.4142135623?
    false
    false
    true
---*)
