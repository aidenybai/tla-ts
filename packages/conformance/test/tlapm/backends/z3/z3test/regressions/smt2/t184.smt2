(*---
description: z3test's regression regressions/smt2/t184.smt2.
ref: regressions/smt2/t184.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation


(set-option :pp.max-depth 100)
(declare-fun p (Int) Bool)
(declare-fun f (Int Real) Bool)

(push)
(assert (forall ((x Int) (z Real) (z2 Int)) (=> (and (f x z) (f z2 z)) (exists ((y Int)) (and (not (= y x)) (f y z))))))
(apply nnf :print false :print-benchmark true)
(pop)

(echo "----")

(*--- recorded
all:
  exit: 0
  transcript: |-
    (declare-fun f (Int Real) Bool)
    (declare-fun y!0 (Real Int) Int)
    (assert (forall ((x Int) (z Real) (z2 Int))
              (or (not (f x z))
                  (not (f z2 z))
                  (and (not (= (y!0 z x) x)) (f (y!0 z x) z)))))
    (check-sat)
    ----
---*)
