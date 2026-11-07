(*---
description: z3test's regression regressions/smt2/fp-sqrt-9.smt2.
ref: regressions/smt2/fp-sqrt-9.smt2
features:
  - z3test
outcome: sat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-option :produce-models true)
(set-info :source "Handcrafted; from Z3 GitHub issue 222.")
(set-info :status sat)

(set-logic QF_FP)
(declare-fun x () (_ FloatingPoint 3 4))

(assert (= (fp.sqrt RNE x) (fp.sqrt RNE (fp #b0 #b000 #b001))))
(check-sat)
(get-value (x))
(exit)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    ((x (fp #b0 #b000 #b001)))
---*)
