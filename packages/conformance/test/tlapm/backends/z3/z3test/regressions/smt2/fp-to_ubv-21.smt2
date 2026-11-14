(*---
description: z3test's regression regressions/smt2/fp-to_ubv-21.smt2.
ref: regressions/smt2/fp-to_ubv-21.smt2
features:
  - z3test
outcome: unsat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-info :status unsat)
(set-info :source "Handcrafted by C.M. Wintersteiger")

(assert (not (= #xFE ((_ fp.to_ubv 8) RTZ (fp #b0 #b10110 #b1111110010))))) ; 254.25 RTZ = 254 = xFE

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
