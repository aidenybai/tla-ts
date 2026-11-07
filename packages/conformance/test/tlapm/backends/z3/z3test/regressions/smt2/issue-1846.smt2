(*---
description: z3test's regression regressions/smt2/issue-1846.smt2.
ref: regressions/smt2/issue-1846.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :produce-unsat-cores true)

(define-fun intToStr ((i Int)) String (ite (> i 0) (int.to.str i) (str.++ "-" (int.to.str (- 0 i)))))

(declare-const t Int)
(declare-const s String)

(assert (! (= t 42) :named a))
(assert (= s (intToStr t)))

(check-sat)
(reset)

 (declare-const t Int)
 (declare-const s String)
 (assert (>= t 53))
 (assert (= s (int.to.str t)))
 (check-sat)

(reset)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    sat
---*)
