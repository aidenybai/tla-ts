(*---
description: z3test's regression regressions/smt2/t11.smt2.
ref: regressions/smt2/t11.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation


(declare-fun f (Int Int) Int)

(set-option :pp.max-depth 10)

(display (forall ((x Int) (y0 Int))
                 (let ((y (f x y0)))
                   (or (forall ((z Int))
                            (or (= (f z x) (f y x))
                                       (exists ((w Int))
                                               (= (f z w) (f y x)))))
                       (> (f y y) 0)))))

(*--- recorded
all:
  exit: 0
  transcript: |-
    (forall ((x Int) (y0 Int))
      (or (forall ((z Int))
            (or (= (f z x) (f (f x y0) x))
                (exists ((w Int)) (= (f z w) (f (f x y0) x)))))
          (> (f (f x y0) (f x y0)) 0)))
---*)
