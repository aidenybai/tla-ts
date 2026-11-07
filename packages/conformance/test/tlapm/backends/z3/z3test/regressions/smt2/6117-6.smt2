(*---
description: z3test's regression regressions/smt2/6117-6.smt2.
ref: regressions/smt2/6117-6.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :model_validate true)
(set-info :status sat) 

(declare-fun a () Float64)
(declare-fun b () Float64)
(assert (= b (fp #b0 #b10111101110 #b0000000000101010111000101110000010010100111011011000)))
(assert (= a (fp #b1 #b11111111110 #b1111111111111111111111111111111111111111111111111111)))
(assert (= (fp.fma RTP b a a) a))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
