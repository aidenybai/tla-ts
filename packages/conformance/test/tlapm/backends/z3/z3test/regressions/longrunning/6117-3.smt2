(*---
description: z3test's regression regressions/longrunning/6117-3.smt2.
ref: regressions/longrunning/6117-3.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :model_validate true)
(set-info :status sat)

(declare-fun x () Float64)
(declare-fun y () Float64)
(declare-fun z () Float64)
(declare-fun r () Float64)
(assert (distinct x (fp #b0 #b11111001010 #b0111110000010101111110101011010100011000011010010011)))
(assert (distinct z (fp #b0 #b01001110111 #b0010111000000100111110110011001101010101110110011000)))
(assert (= r (fp #b1 #b11111111110 #b1111111111111111111111111111111111111111111111111111) (fp.fma RTP x y z) r))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
