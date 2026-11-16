(*---
description: z3test's regression regressions/smt2/root-pre.smt2.
ref: regressions/smt2/root-pre.smt2
features:
  - z3test
outcome: unsat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-option :auto-config true)

(assert (not (= (* (^ 0.375 (/ 1.0 4.0)) (^ 0.375 (/ 1.0 4.0)))
		(^ (* 0.375 0.375) (/ 1.0 4.0)))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
