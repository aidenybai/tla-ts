(*---
description: z3test's regression regressions/smt2/rec.smt2.
ref: regressions/smt2/rec.smt2
features:
  - z3test
outcome: any
---*)
(define-fun-rec f ((x Int) (y Bool)) Int
    (if y (f (+ x 1) (not y)) x))

(define-funs-rec 
   ((ping ((x Int) (y Bool)) Int)
    (pong ((a Int) (b Int)) Bool))

   ((if y (ping (+ x 1) (pong x x)) x)
    (if (> a b) (ping a (pong b b)) b)))

(assert (< (f 0 true) 0))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: |-
    (error "line 9 column 38: invalid function definition, sort mismatch. Expcected Bool but function body has sort Int")
    unsat
---*)
