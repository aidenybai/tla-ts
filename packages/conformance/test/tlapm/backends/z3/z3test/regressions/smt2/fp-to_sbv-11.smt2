(*---
description: z3test's regression regressions/smt2/fp-to_sbv-11.smt2.
ref: regressions/smt2/fp-to_sbv-11.smt2
features:
  - z3test
outcome: unsat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-info :status unsat)
(set-info :source "Handcrafted by C.M. Wintersteiger")

(declare-const X (_ BitVec 8))
; -1.9921875p6 == -127.5 -> -128 = #x80 because of RTN
(assert (= X ((_ fp.to_sbv 8) RTN (fp #b1 #b10101 #b1111111000))))
(assert (not (= X #x80)))

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
