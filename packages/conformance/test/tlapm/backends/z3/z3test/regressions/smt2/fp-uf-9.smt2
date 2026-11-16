(*---
description: z3test's regression regressions/smt2/fp-uf-9.smt2.
ref: regressions/smt2/fp-uf-9.smt2
features:
  - z3test
outcome: sat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-logic QF_FP)
(set-info :status sat)

(declare-fun my_rm_uf_rmrm (RoundingMode) RoundingMode)
(assert (= (my_rm_uf_rmrm RTN) RTP))
(assert (= (my_rm_uf_rmrm RTP) RTN))

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
