(*---
description: z3test's regression regressions/smt2/fp-to_ubv-13.smt2.
ref: regressions/smt2/fp-to_ubv-13.smt2
features:
  - z3test
outcome: unsat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-info :status unsat)
(set-info :source "Handcrafted by C.M. Wintersteiger")

; 254.875 RTN = 254 = xFE
(assert (not (= #xFE ((_ fp.to_ubv 8) RTN (fp #b0 #b10110 #b1111110111))))) 

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
