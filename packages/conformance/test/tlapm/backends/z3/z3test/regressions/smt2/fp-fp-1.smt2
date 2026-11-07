(*---
description: z3test's regression regressions/smt2/fp-fp-1.smt2.
ref: regressions/smt2/fp-fp-1.smt2
features:
  - z3test
outcome: sat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-info :status sat)
(set-info :source "Handcrafted by C.M. Wintersteiger")

(declare-fun X () (_ FloatingPoint 11 53))

; Variations of 1.75p1 = 3.5p0
(assert (= X (fp #b0 #b10000000000 #xc000000000000)))
(assert (= X ((_ to_fp 11 53) RTZ (fp #b0 #b1000000000 #xc00000000000)))) 
(assert (= X ((_ to_fp 11 53) RTZ 1.75 1)))
(assert (= X ((_ to_fp 11 53) RTZ 3.5)))

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
