(*---
description: z3test's regression regressions/smt2/z3.4.smt2.
ref: regressions/smt2/z3.4.smt2
features:
  - z3test
outcome: unsat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-option :auto-config true)
(set-option :produce-models true)

(declare-const p Bool)
(declare-const q Bool)
(declare-const r Bool)
(define-fun conjecture () Bool
	(=> (and (=> p q) (=> q r))
		(=> p r)))
(assert (not conjecture))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
