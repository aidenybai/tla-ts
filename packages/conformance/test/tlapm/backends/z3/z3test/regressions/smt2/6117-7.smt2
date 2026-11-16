(*---
description: z3test's regression regressions/smt2/6117-7.smt2.
ref: regressions/smt2/6117-7.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :model_validate true)
(set-info :status sat) 

(set-info :rewriter.bv_sort_ac true)
(set-info :rewriter.bv_extract_prop true)
(set-info :rewriter.bv_le_extra true)
(set-info :rewriter.bv_ite2id true)

(declare-fun b () Float64)
(declare-fun c () Float64)
(declare-fun d () Float64)
(declare-fun r () Float64)
(check-sat)
(assert (= b (fp #b1 #b11111111100 #b1011001010010001100100010101001101011100101111010100)))
(check-sat)
(assert (distinct c (fp #b0 #b00011000100 #b1100010001001000011111001110010110001101101011010001)))
(check-sat)
;(assert (= d (fp #b0 #b00111111110 #b011111111110001000001000110001100001111100;1001011101)))
;(assert (= (fp.fma RTN b c d) r))
;(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    sat
    sat
---*)
