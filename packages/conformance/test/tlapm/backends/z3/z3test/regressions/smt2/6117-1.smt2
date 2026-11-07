(*---
description: z3test's regression regressions/smt2/6117-1.smt2.
ref: regressions/smt2/6117-1.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :model_validate true)
(set-info :status sat) 

(declare-fun a () Float64)
(declare-fun b () Float64)
(assert (= a (fp #b1 #b11111111110 #b1111111111111111111111111111111111111111111111111111)))
(assert (= b (fp #b0 #b11111110111 #b1111101100111000010100011011001111010101111001101010)))
(assert (= (fp.fma RTP b a a) a))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
