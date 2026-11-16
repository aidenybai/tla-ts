(*---
description: z3test's regression regressions/smt2/fp-conversions-40.smt2.
ref: regressions/smt2/fp-conversions-40.smt2
features:
  - z3test
outcome: sat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-info :status sat)
(set-info :source "Handcrafted by C.M. Wintersteiger")

(declare-fun y () Real)

(assert (= y (fp.to_real (fp #b0 #b10000000100 #x5000000000000))))

(check-sat)
(get-value (y))
(check-sat-using smt)
(get-value (y))
(exit)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    ((y 42.0))
    sat
    ((y 42.0))
---*)
