(*---
description: z3test's regression regressions/smt2/bad_patterns.smt2.
ref: regressions/smt2/bad_patterns.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-option :auto-config false)
(set-option :smt.mbqi false)

(declare-fun ff ((Array Int Int)) (Array Int Int))
(assert (forall ((s (Array Int Int)) ) (! (= s (ff s)) :pattern (2))))
(assert (forall ((s (Array Int Int)) ) (! (= s (ff s)) :pattern ())))
(assert (forall ((s (Array Int Int)) ) (! (= s (ff s)) :pattern)))
(assert (forall ((s (Array Int Int)) ) (! (= s (ff s)) :pattern (1.0))))
(assert (forall ((s (Array Int Int)) ) (! (= s (ff s)) :pattern (=))))
(assert (forall ((s (Array Int Int)) ) (! (= s (ff s)) :pattern (s))))
(assert (forall ((s (Array Int Int)) ) (! (= s (ff s)) :pattern (ff s))))
(assert (forall ((s (Array Int Int)) ) (! (= (store s 0 0) (ff s)) :pattern 2)))
(assert (forall ((s (Array Int Int)) ) (! (= (store s 0 0) (ff s)) :pattern true)))

(apply simplify)

(*--- recorded
all:
  exit: 0
  transcript: |-
    (error "line 7 column 65: invalid pattern, '(' or identifier expected")
    (error "line 9 column 63: invalid s-expression, unexpected ')'")
    (error "line 10 column 65: invalid pattern, '(' or identifier expected")
    (error "line 11 column 66: invalid function application, arguments missing")
    (error "line 12 column 66: invalid function application, arguments missing")
    (goals
    (goal
      (forall ((s (Array Int Int))) (= s (ff s)))
      (forall ((s (Array Int Int))) (! (= s (ff s)) :pattern ((ff s))))
      (forall ((s (Array Int Int))) (= (store s 0 0) (ff s)))
      :precision precise :depth 1)
    )
---*)
