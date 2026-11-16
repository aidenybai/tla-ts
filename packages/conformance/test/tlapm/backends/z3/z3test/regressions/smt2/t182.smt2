(*---
description: z3test's regression regressions/smt2/t182.smt2.
ref: regressions/smt2/t182.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation


(set-option :pp.max-depth 100)

(set-logic QF_UFLIA)
(declare-const a Int)
(declare-const b Int)
(declare-fun f (Int) Int)

(assert (= b (+ (f a) 1)))
(assert (>= (f b) a))
(assert (>= (f (f (f (f (f (f (f (f (f a))))))))) (f a)))

(apply (and-then simplify solve-eqs) :print-benchmark true :print false)

(*--- recorded
all:
  exit: 0
  transcript: |-
    (declare-fun a () Int)
    (declare-fun f (Int) Int)
    (assert (>= (f (+ 1 (f a))) a))
    (assert (>= (f (f (f (f (f (f (f (f (f a))))))))) (f a)))
    (check-sat)
---*)
