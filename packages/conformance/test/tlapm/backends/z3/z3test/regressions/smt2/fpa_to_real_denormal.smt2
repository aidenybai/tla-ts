(*---
description: z3test's regression regressions/smt2/fpa_to_real_denormal.smt2.
ref: regressions/smt2/fpa_to_real_denormal.smt2
features:
  - z3test
outcome: unsat
---*)
; Regression: fp.to_real must produce correct values for denormal floats.
; Denormals require subtracting the normalization shift from the exponent;
; without the fix denormals in fp.to_real were ~2^lz times too large.
; Transferred from src/test/fpa.cpp (test_fp_to_real_denormal).
(set-option :model_validate true)

; Test 1: denormal ~0.232 must NOT be > 1.0 -> unsat
(push)
(assert (> (fp.to_real (fp #b0 #b00 #b00111011011111001011101)) 1.0))
(check-sat)
(pop)

; Test 2: denormal with leading significand bit = 1 has fp.to_real = 0.5 -> sat
(push)
(assert (= (fp.to_real (fp #b0 #b00 #b10000000000000000000000)) (/ 1.0 2.0)))
(check-sat)
(pop)

; Test 3: denormal with fp.to_real = 0.125 -> sat
(push)
(assert (= (fp.to_real (fp #b0 #b00 #b00100000000000000000000)) (/ 1.0 8.0)))
(check-sat)
(pop)

; Test 4: maximum finite normal number must be > 1.0 -> sat
(push)
(assert (> (fp.to_real (fp #b0 #b01 #b11111111111111111111111)) 1.0))
(check-sat)
(pop)

(*--- recorded
all:
  exit: 0
  transcript: |-
    unsat
    sat
    sat
    sat
---*)
