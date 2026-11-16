(*---
description: z3test's regression regressions/smt2/3930.smt2.
ref: regressions/smt2/3930.smt2
features:
  - z3test
outcome: unsat
---*)
(declare-datatypes ((DD 1)) (
    (par (T) (
        (DDA (DDx T) (DDy T)) 
        (DDB (DDz (DD Int)))
;        (DDB (DDz (DD T))) ; this instead of the DD Int makes the assertion unsat
        ))))

(declare-fun dd () (DD Int))
(declare-fun yy () Int)
(declare-fun xx () Int)
(define-sort DDI () (DD Int))
(define-sort DDII () (DD DDI))

(assert (and 
(= xx yy) 
(= ((as DDy Int) dd) yy)
(= (DDx dd) xx) 
))
(assert (not (= xx yy)))
(check-sat)
; SMT says (error "line 14 column 10: unknown function/constant DDy")
; SMT says sat

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
