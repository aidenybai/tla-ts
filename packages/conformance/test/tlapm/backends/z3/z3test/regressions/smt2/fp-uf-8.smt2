(*---
description: z3test's regression regressions/smt2/fp-uf-8.smt2.
ref: regressions/smt2/fp-uf-8.smt2
features:
  - z3test
outcome: sat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-logic QF_FP)
(set-info :status sat)

(declare-fun my_rm_uf_rmb (RoundingMode) Bool)
(assert (= (my_rm_uf_rmb RTP) true))
(assert (= (my_rm_uf_rmb RTN) false))

(check-sat)
(check-sat-using smt)
(exit)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    sat
---*)
