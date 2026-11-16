(*---
description: z3test's regression regressions/smt2/array.smt2.
ref: regressions/smt2/array.smt2
features:
  - z3test
outcome: unsat
---*)

; Copyright (c) 2015 Microsoft Corporation



(define-fun a () (Array Int Int) ((as const (Array Int Int)) 0))
(assert (= (store (store a 0 1) 0 0) (store a 0 1)))
(check-sat)

(reset)
(define-fun a () (Array Int Int) ((as const (Array Int Int)) 0))
(assert (= (store (store (store a 0 1) 1 2) 0 0) (store (store a 0 1) 1 2)))
(check-sat)

(reset)
(define-fun a () (Array Int Int) ((as const (Array Int Int)) 0))
(assert (= (store (store (store (store a 0 1) 1 2) 2 3) 0 0) (store (store (store a 0 1) 1 2) 2 3)))
(check-sat)

(reset)
(set-option :auto-config true)
(define-fun a () (Array Int Int) ((as const (Array Int Int)) 0))
(assert (= (store (store a 0 1) 0 0) (store a 0 1)))
(check-sat)

(reset)
(set-option :auto-config true)
(define-fun a () (Array Int Int) ((as const (Array Int Int)) 0))
(assert (= (store (store (store a 0 1) 1 2) 0 0) (store (store a 0 1) 1 2)))
(check-sat)

(reset)
(set-option :auto-config true)
(define-fun a () (Array Int Int) ((as const (Array Int Int)) 0))
(assert (= (store (store (store (store a 0 1) 1 2) 2 3) 0 0) (store (store (store a 0 1) 1 2) 2 3)))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: |-
    unsat
    unsat
    unsat
    unsat
    unsat
    unsat
---*)
