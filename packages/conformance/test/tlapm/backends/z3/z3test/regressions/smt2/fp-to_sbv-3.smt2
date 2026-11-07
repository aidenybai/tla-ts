(*---
description: z3test's regression regressions/smt2/fp-to_sbv-3.smt2.
ref: regressions/smt2/fp-to_sbv-3.smt2
features:
  - z3test
outcome: unsat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-info :status unsat)
(set-info :source "Handcrafted by C.M. Wintersteiger")

(declare-fun Xbv () (_ BitVec 8))
(declare-fun Xf () (_ FloatingPoint 5 11))

(assert (= Xf (fp #b1 #b10000 #b0000000000))) ; -1.0p1 = -2.0
(assert (= Xbv ((_ fp.to_sbv 8) RTZ Xf))) 
(assert (not (= Xbv #xfe)))

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
