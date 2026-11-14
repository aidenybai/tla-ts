(*---
description: z3test's regression regressions/smt2/string-itos.smt2.
ref: regressions/smt2/string-itos.smt2
features:
  - z3test
outcome: any
---*)
;(set-logic QF_S)
(simplify (str.to.int ""))
(simplify (str.to.int "-2"))
(simplify (str.to.int "2"))
(simplify (str.to.int "2/1"))
(simplify (int.to.str -1))
(simplify (int.to.str 1))
(simplify (int.to.str 0))
(simplify (str.to.int (int.to.str -2)))
(declare-fun x () Int)
(simplify (str.to.int (int.to.str x)))
(assert (= x (str.to.int "a")))
(assert (not (= x -1)))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: |-
    (- 1)
    (- 1)
    2
    (- 1)
    ""
    "1"
    "0"
    (- 1)
    (ite (>= x 0) x (- 1))
    unsat
---*)
