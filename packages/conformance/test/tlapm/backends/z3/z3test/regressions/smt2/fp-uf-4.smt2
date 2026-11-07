(*---
description: z3test's regression regressions/smt2/fp-uf-4.smt2.
ref: regressions/smt2/fp-uf-4.smt2
features:
  - z3test
outcome: sat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-logic QF_FP)
(set-info :status sat)

(declare-fun my_uf_bf (Bool) Float32)
(assert (= (_ +zero 8 24) (my_uf_bf true)))
(assert (= (_ -zero 8 24) (my_uf_bf false)))

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
