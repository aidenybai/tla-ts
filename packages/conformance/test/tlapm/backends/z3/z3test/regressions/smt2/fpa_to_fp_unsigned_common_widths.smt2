(*---
description: z3test's regression regressions/smt2/fpa_to_fp_unsigned_common_widths.smt2.
ref: regressions/smt2/fpa_to_fp_unsigned_common_widths.smt2
features:
  - z3test
outcome: sat
---*)
; Regression: unsigned BV-to-FP conversion at common widths (BitVec 32 ->
; Float32) preserves in-range values and saturates overflow correctly.
; Transferred from src/test/fpa.cpp (test_to_fp_unsigned_common_widths).
(set-logic QF_BVFP)
(set-option :model_validate true)
(declare-const high (_ BitVec 32))
(assert (or (= high #xfffffffe) (= high #xffffffff)))
(assert (= ((_ to_fp_unsigned 8 24) RTN high)
           (fp #b0 #b10011110 #b11111111111111111111111)))
(assert (= ((_ to_fp_unsigned 8 24) RTZ high)
           (fp #b0 #b10011110 #b11111111111111111111111)))
(assert (= ((_ to_fp_unsigned 8 24) RTP high)
           (fp #b0 #b10011111 #b00000000000000000000000)))
(assert (= ((_ to_fp_unsigned 8 24) RNE high)
           (fp #b0 #b10011111 #b00000000000000000000000)))
(assert (= ((_ to_fp_unsigned 8 24) RNA high)
           (fp #b0 #b10011111 #b00000000000000000000000)))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
