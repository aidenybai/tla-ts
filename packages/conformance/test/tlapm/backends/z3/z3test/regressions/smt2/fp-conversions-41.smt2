(*---
description: z3test's regression regressions/smt2/fp-conversions-41.smt2.
ref: regressions/smt2/fp-conversions-41.smt2
features:
  - z3test
outcome: unsat
---*)
;; Copyright (c) 2015 Microsoft Corporation

(set-info :status unsat)
(set-info :source "Handcrafted by C.M. Wintersteiger")

(declare-fun x () Real)
(declare-fun y () Real)
(assert (= x (fp.to_real ((_ to_fp 8 24) #b11111111100000000000001000000000))))
(assert (= y (fp.to_real ((_ to_fp 8 24) #b11111111100000000000000100000000))))

(assert (not (= x y)))

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
