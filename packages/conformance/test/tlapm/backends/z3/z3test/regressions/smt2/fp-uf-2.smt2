(*---
description: z3test's regression regressions/smt2/fp-uf-2.smt2.
ref: regressions/smt2/fp-uf-2.smt2
features:
  - z3test
outcome: sat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-info :status sat)
(set-option :model_validate true)

(declare-fun f (Int) (_ FloatingPoint 53 11))

(assert (= (f 1) (_ +oo 53 11)))
(assert (= (f 2) (_ -oo 53 11)))

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
