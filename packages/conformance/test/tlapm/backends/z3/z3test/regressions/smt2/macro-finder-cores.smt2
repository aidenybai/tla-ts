(*---
description: z3test's regression regressions/smt2/macro-finder-cores.smt2.
ref: regressions/smt2/macro-finder-cores.smt2
features:
  - z3test
outcome: unsat
---*)
(set-option :produce-unsat-cores true)

(declare-fun f (Int) Int)
(declare-fun g (Int) Int)

(assert (! (forall ((x Int)) (= (f x) (+ x 1))) :named A))
(assert (! (forall ((x Int)) (= (g x) (- x 1))) :named B))

(declare-fun x () Int)
(assert (! (= (f x) (g x)) :named C))

(set-option :smt.macro_finder true)
(set-option :smt.quasi_macros true)
(check-sat)
(get-unsat-core)

(check-sat-using (then macro-finder smt))
(get-unsat-core)

(*--- recorded
all:
  exit: 0
  transcript: |-
    unsat
    (A B C)
    unsat
    (C A B)
---*)
