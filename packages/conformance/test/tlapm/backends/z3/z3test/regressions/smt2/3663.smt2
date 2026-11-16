(*---
description: z3test's regression regressions/smt2/3663.smt2.
ref: regressions/smt2/3663.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :proof true) 
(define-fun a () Int 7) 
(declare-fun b () Int) 
(declare-fun c () Int) 
(define-fun d () Bool (<= b a )) 
(define-fun e () Bool d ) 
(assert e) 
(maximize c) 
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
