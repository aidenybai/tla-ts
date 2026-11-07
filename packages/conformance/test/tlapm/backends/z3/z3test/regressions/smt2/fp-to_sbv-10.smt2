(*---
description: z3test's regression regressions/smt2/fp-to_sbv-10.smt2.
ref: regressions/smt2/fp-to_sbv-10.smt2
features:
  - z3test
outcome: unsat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-info :status unsat)
(set-info :source "Handcrafted by C.M. Wintersteiger")

; -1.9921875p6 == -127.5 -> -127 = #x81 because of RTP
(assert (not (= #x81 ((_ fp.to_sbv 8) RTP (fp #b1 #b10101 #b1111111000)))))

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
