(*---
description: >-
  z3test's regression regressions/smt2/4008.smt2. The query is reachable, as Z3's default spacer
  engine finds, but with fp.spacer.gpdr Z3 answers sat. Its gpdr_check_reachability closes a node
  whose children are all reachable without closing the parents that node completes, so the root
  never closes and gpdr reports the query unreachable. The bug is in
  src/muz/spacer/spacer_pdr.cpp#gpdr_check_reachability.
ref: regressions/smt2/4008.smt2
features:
  - z3test
  - tlapm-bug
outcome: sat
correct:
  all:
    exit: 0
    transcript: |-
      unsat
      unsat
---*)
(set-option :fp.spacer.gpdr true)
(declare-fun a (Bool Bool Int Int Int Int Int Int Int) Bool)
(assert (forall ((b Int) (bc Bool) (bd Bool) (bk Int) (be Int) (bf Int) (bm Int) (bn Int))
     (=> (= bc bd false) (= bk 0) (a bc bd bf b bm bn bk be b))))
(assert (forall ((bc Bool) (bd Bool) (bf Int) (bm Int) (bn Int) (bk Int) (b Int) (c Int)
         (d Int) (g Int) (e Int) (f Bool) (gn Int) (ge Int) (gl Int) (gd Bool))
     (=> (a bc bd bf b bm bn bk e b) (or (= f bc) (= bk 2)) (a f gd d gl c gn g ge e))))
(assert (forall ((bc Bool) (bd Bool) (bf Int) (bm Int) (bn Int) (bk Int) (be Int) (b Int))
     (=> (a bc bd bf b bm bn bk be b) (or bc bd) false)))
(check-sat-using horn)
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    unsat
---*)
