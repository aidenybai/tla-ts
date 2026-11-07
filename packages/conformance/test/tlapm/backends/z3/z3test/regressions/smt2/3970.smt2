(*---
description: z3test's regression regressions/smt2/3970.smt2.
ref: regressions/smt2/3970.smt2
features:
  - z3test
outcome: sat
---*)
;(set-option :rewriter.flat false)
(declare-datatypes ((a 0)) (((b (c a)) d)))
(declare-sort e)
(declare-fun k (e) a)
(declare-fun l (e) a)
(declare-fun j (a a) a)
(assert
 (forall ((ai e))
 (ite ((_ is d) (k ai)) true
  (ite ((_ is b) (k ai))
  (forall ((ag e))
   (= (k ag) (c (k ai))))
  true))))
(assert
 (exists ((ah a))
 (or (distinct (j (j ah d) d) ah)
  (exists ((ag e))
  (and (= (k ag) ah) (= (l ag) d))))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
