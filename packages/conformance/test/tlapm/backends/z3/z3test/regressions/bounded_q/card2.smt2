(*---
description: z3test's regression regressions/bounded_q/card2.smt2.
ref: regressions/bounded_q/card2.smt2
features:
  - z3test
outcome: sat
---*)

; Copyright (c) 2015 Microsoft Corporation

(declare-sort S)
(declare-const a1 S)
(declare-const a2 S)
(declare-const a3 S)
(declare-fun f (S) S)
(declare-const a S)
(declare-const b S)
(declare-const c S)
(declare-const d S)
(assert (forall ((x S)) (or (= x a1) (= x a2) (= x a3))))
(assert (not (= (f a) b)))
(assert (not (= (f b) b)))
(assert (not (= (f c) b)))
(assert (not (= (f d) b)))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
