(*---
description: z3test's regression regressions/smt2/fp-to_ubv-8.smt2.
ref: regressions/smt2/fp-to_ubv-8.smt2
features:
  - z3test
outcome: sat
---*)
;; Copyright (c) 2015 Microsoft Corporation
(set-info :status sat)
(set-info :source "Handcrafted by C.M. Wintersteiger")

; 2^8 = 256 -> unspecified
(assert (not (= #x00 ((_ fp.to_ubv 8) RTP (fp #b0 #b10111 #b0000000000)))))

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
