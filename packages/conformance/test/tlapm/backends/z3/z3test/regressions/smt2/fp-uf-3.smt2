(*---
description: z3test's regression regressions/smt2/fp-uf-3.smt2.
ref: regressions/smt2/fp-uf-3.smt2
features:
  - z3test
outcome: sat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-logic QF_FP)
(set-info :status sat)

(declare-fun my_uf_fb (Float32) Bool)
(assert (= false (my_uf_fb (_ +oo 8 24))))
(assert (= true (my_uf_fb (_ -oo 8 24))))

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
