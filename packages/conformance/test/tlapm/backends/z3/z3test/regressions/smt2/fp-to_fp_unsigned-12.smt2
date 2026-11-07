(*---
description: z3test's regression regressions/smt2/fp-to_fp_unsigned-12.smt2.
ref: regressions/smt2/fp-to_fp_unsigned-12.smt2
features:
  - z3test
outcome: unsat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-info :status unsat)
(set-info :source "Handcrafted by C.M. Wintersteiger")

(declare-fun X () (_ FloatingPoint 5 11))

(assert (= X ((_ to_fp_unsigned 5 11) RTP #x80000000))) ; +2147483648 --> +oo (too large; rounding)
(assert (not (= X (_ +oo 5 11))))

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
