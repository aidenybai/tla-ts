(*---
description: z3test's regression regressions/smt2/fp-conversions-6.smt2.
ref: regressions/smt2/fp-conversions-6.smt2
features:
  - z3test
outcome: unsat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-info :status unsat)
(set-info :source "Handcrafted by C.M. Wintersteiger")

(assert (not (= (_ -zero 3 2) (fp #b1 #b000 #b0)))) ; should both be -0

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
