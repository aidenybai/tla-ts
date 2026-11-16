(*---
description: z3test's regression regressions/smt2/fp-to_fp_unsigned-4.smt2.
ref: regressions/smt2/fp-to_fp_unsigned-4.smt2
features:
  - z3test
outcome: unsat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-info :status unsat)
(set-info :source "Handcrafted by C.M. Wintersteiger")

(declare-fun X () (_ FloatingPoint 5 11))

(assert (= X ((_ to_fp_unsigned 5 11) RTN #x7FFF))) ; +32767 --> +1.9990234375p14
(assert (not (= X ((_ to_fp 5 11) RTZ 32767.0 0))))

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
