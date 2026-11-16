(*---
description: z3test's regression regressions/smt2/fp-uf-6.smt2.
ref: regressions/smt2/fp-uf-6.smt2
features:
  - z3test
outcome: unsat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-logic QF_FP)
(set-info :status unsat)

(declare-fun my_uf (Float32) Float32)
(assert (= ((_ to_fp 8 24) RNE 2.0) (my_uf (_ -oo 8 24))))
(assert (= ((_ to_fp 8 24) RNE (- 2.0)) (my_uf (_ +oo 8 24))))
(assert (= (_ -oo 8 24) (my_uf (_ +oo 8 24))))

(check-sat)
(check-sat-using smt)
(exit)

(*--- recorded
all:
  exit: 0
  transcript: |-
    unsat
    unsat
---*)
