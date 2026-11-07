(*---
description: z3test's regression regressions/smt2/fp-conversions-30.smt2.
ref: regressions/smt2/fp-conversions-30.smt2
features:
  - z3test
outcome: sat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-info :status sat)
(set-info :source "Handcrafted by C.M. Wintersteiger")

(declare-fun rm () RoundingMode)
(declare-fun x () (_ BitVec 64))
(declare-fun y () Real)

(assert (and 
	  (= x ((_ fp.to_ubv 64) rm (fp #b0 #b10000000100 #x5000000000000)))
	  (= y (fp.to_real (fp #b0 #b10000000100 #x5000000000000))))
)

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
