(*---
description: z3test's regression regressions/smt2/fp-to_ubv-11.smt2.
ref: regressions/smt2/fp-to_ubv-11.smt2
features:
  - z3test
outcome: unsat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-info :status unsat)
(set-info :source "Handcrafted by C.M. Wintersteiger")

; 2^7 = 128 = #x80
(assert (not (= #x80 ((_ fp.to_ubv 8) RTP (fp #b0 #b10110 #b0000000000))))) 

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
