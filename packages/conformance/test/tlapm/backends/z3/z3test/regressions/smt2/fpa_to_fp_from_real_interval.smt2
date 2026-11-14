(*---
description: z3test's regression regressions/smt2/fpa_to_fp_from_real_interval.smt2.
ref: regressions/smt2/fpa_to_fp_from_real_interval.smt2
features:
  - z3test
outcome: sat
---*)
; Regression: soundness bug in to_fp (from real) with a symbolic real interval.
; With RTZ and a real constrained to an interval containing the exact rational
; value of a float, Z3 must return sat. Broken when mk_to_real computed
; 2^(1/|exp|) instead of 1/(2^|exp|) for floats with negative exponents.
; Transferred from src/test/fpa.cpp (test_to_fp_from_real_interval).
(set-logic QF_FPLRA)
(declare-const x Float32)
(assert (= x (fp #b1 #b01111100 #b11110111110011001010011)))
(declare-const r Real)
(assert (and (> r (- (/ 4127125.0 16777216.0))) (<= r (- (/ 16508499.0 67108864.0)))))
(declare-const w Float32)
(assert (= w ((_ to_fp 8 24) RTZ r)))
(assert (= x w))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
