(*---
description: z3test's regression regressions/smt2/fpa_to_fp_unsigned_exponent_width_boundary.smt2.
ref: regressions/smt2/fpa_to_fp_unsigned_exponent_width_boundary.smt2
features:
  - z3test
outcome: sat
---*)
; Regression: preserve the signed value of the internal exponent when
; converting a symbolic unsigned bit-vector. In-range values must not take the
; overflow path (equal-width boundary case).
; Transferred from src/test/fpa.cpp (test_to_fp_unsigned_exponent_width_boundary).
(set-logic QF_BVFP)
(set-option :model_validate true)
(declare-const high (_ BitVec 13))
(assert (or (= high #b1111111111110) (= high #b1111111111111)))
(assert (= ((_ to_fp_unsigned 2 11) RTN high) (fp #b0 #b10 #b1111111111)))
(assert (= ((_ to_fp_unsigned 2 11) RTZ high) (fp #b0 #b10 #b1111111111)))
(assert (= ((_ to_fp_unsigned 2 11) RTP high) (_ +oo 2 11)))
(assert (= ((_ to_fp_unsigned 2 11) RNE high) (_ +oo 2 11)))
(assert (= ((_ to_fp_unsigned 2 11) RNA high) (_ +oo 2 11)))
(declare-const small (_ BitVec 13))
(assert (or (= small #b0000000000001) (= small #b0000000000010)))
(assert (= ((_ to_fp_unsigned 2 11) RTN small)
           (ite (= small #b0000000000001)
                (fp #b0 #b01 #b0000000000)
                (fp #b0 #b10 #b0000000000))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
