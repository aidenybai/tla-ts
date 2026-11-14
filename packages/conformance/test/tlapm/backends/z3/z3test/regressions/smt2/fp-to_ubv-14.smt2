(*---
description: z3test's regression regressions/smt2/fp-to_ubv-14.smt2.
ref: regressions/smt2/fp-to_ubv-14.smt2
features:
  - z3test
outcome: unsat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-info :status unsat)
(set-info :source "Handcrafted by C.M. Wintersteiger")

; 254.875 RTP = 255 = XFF
(assert (not (= #xFF ((_ fp.to_ubv 8) RTP (fp #b0 #b10110 #b1111110111))))) 

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
