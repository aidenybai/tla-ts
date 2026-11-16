(*---
description: z3test's regression regressions/smt2/3665.smt2.
ref: regressions/smt2/3665.smt2
features:
  - z3test
outcome: sat
---*)
(declare-fun a () (Seq Int)) 
(declare-fun b () Int) 
(declare-fun c () Int) 
(define-fun d () Int b) 
(define-fun j () Bool (distinct c d)) 
(define-fun e () Bool j) 
(define-fun f () Bool (not e)) 
(define-fun g () (Seq Int) (seq.unit c)) 
(define-fun h () Int (seq.indexof a g)) 
(define-fun i () Bool (> h b)) 
(define-fun k () Bool (or f i)) 
(assert k) 
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
