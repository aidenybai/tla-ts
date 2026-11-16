(*---
description: z3test's regression regressions/smt2/6117-4.smt2.
ref: regressions/smt2/6117-4.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :model_validate true)
(set-info :status sat) 

(declare-fun a () Float64)
(declare-fun b () Float64)
(assert (= a (fp #b0 #b11111111110 #b1111111111111111111111111111111111111111111111111111)))
(assert (= b (fp #b0 #b11111100001 #b0111011111011101010111011000011011101111111110010010)))
(assert (= (fp.fma RTN b b a) a))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
