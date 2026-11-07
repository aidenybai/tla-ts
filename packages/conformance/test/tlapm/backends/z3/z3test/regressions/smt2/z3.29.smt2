(*---
description: z3test's regression regressions/smt2/z3.29.smt2.
ref: regressions/smt2/z3.29.smt2
features:
  - z3test
outcome: sat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-option :auto-config true)
(set-option :produce-models true)
(set-option :global-decls false) ;; tests are executed using SMTLIB2_COMPLIANT=false

(declare-const x Int)
(declare-const y Int)
(declare-const z Int)
(push)
(assert (= (+ x y) 10))
(assert (= (+ x (* 2 y)) 20))
(check-sat)
(pop) ; remove the two assertions
(push) 
(assert (= (+ (* 3 x) y) 10))
(assert (= (+ (* 2 x) (* 2 y)) 21))
(check-sat)
(declare-const p Bool)
(pop)
(assert p) ; error, since declaration of p was removed from the stack

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    unsat
    (error "line 21 column 8: unknown constant p")
---*)
