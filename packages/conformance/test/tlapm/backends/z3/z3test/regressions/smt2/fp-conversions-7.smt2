(*---
description: z3test's regression regressions/smt2/fp-conversions-7.smt2.
ref: regressions/smt2/fp-conversions-7.smt2
features:
  - z3test
outcome: unsat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-info :status unsat)
(set-info :source "Handcrafted by C.M. Wintersteiger")

(assert (not (= (_ NaN 6 8) (fp #b0 #b111111 #b0000001)))) ; should both be NaNs

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
