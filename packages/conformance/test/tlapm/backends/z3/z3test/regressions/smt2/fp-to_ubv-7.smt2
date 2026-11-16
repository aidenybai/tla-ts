(*---
description: z3test's regression regressions/smt2/fp-to_ubv-7.smt2.
ref: regressions/smt2/fp-to_ubv-7.smt2
features:
  - z3test
outcome: sat
---*)
;; Copyright (c) 2015 Microsoft Corporation
(set-info :status sat)
(set-info :source "Handcrafted by C.M. Wintersteiger")

; 2^15 = 32768 -> unspecified
(assert (not (= #x00 ((_ fp.to_ubv 8) RTP (fp #b0 #b11110 #b0000000000)))))

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
