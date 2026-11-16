(*---
description: z3test's regression regressions/smt2/3960.smt2.
ref: regressions/smt2/3960.smt2
features:
  - z3test
outcome: unsat
---*)
(define-funs-rec ((a () Int) 
                  (b ((c Int)) Bool))
 (0 
 (ite (< c 0) false (ite (= c 0) true (b (- 2))))))
(assert (b 7))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
