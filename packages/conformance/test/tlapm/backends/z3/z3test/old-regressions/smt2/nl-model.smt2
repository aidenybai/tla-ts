(*---
description: z3test's regression old-regressions/smt2/nl-model.smt2.
ref: old-regressions/smt2/nl-model.smt2
features:
  - z3test
outcome: sat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-option :auto-config true)
(set-option :model-validate true)
(set-logic QF_NRA)

(declare-fun skoSM1 () Real)
(declare-fun skoSP1 () Real)
(declare-fun skoS () Real)
(declare-fun skoX () Real)



(assert (<= (* skoSM1 (+ 24.0 (* skoSM1 (+ (- 120.0) (* 240.0 skoSM1))))) 2.0))
(assert (not (= skoS 0.0)))

(assert (= (* skoSP1 skoSP1) (+ 1.0 skoX)))

(assert (= (* skoSM1 skoSM1) (+ (- 1.0) skoX)))

(assert (= (* skoS skoS) skoX))

(assert (not (<= skoX 1.0)))

(assert (not (<= skoSP1 0.0)))

(assert (not (<= skoSM1 0.0)))

(assert (not (<= skoS 0.0)))

(assert (not (<= 5.0 skoX)))

(set-info :status sat)
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
