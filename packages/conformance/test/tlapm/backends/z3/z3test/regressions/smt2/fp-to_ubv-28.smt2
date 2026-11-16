(*---
description: z3test's regression regressions/smt2/fp-to_ubv-28.smt2.
ref: regressions/smt2/fp-to_ubv-28.smt2
features:
  - z3test
outcome: unsat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-info :status unsat)
(set-info :source "Handcrafted by C.M. Wintersteiger")

(assert (not (= #x00008000 ((_ fp.to_ubv 32) RTN (fp #b0 #b11110 #b0000000000))))) ; 32768 = #x8000

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
