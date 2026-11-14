(*---
description: z3test's regression regressions/smt2/fp-conversions-3.smt2.
ref: regressions/smt2/fp-conversions-3.smt2
features:
  - z3test
outcome: unsat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-info :status unsat)
(set-info :source "Handcrafted by C.M. Wintersteiger")

(assert (not (= (_ +oo 2 3) (fp #b0 #b11 #b00)))) ; should both be +oo

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
