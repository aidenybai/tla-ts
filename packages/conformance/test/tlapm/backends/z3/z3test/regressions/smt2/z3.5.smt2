(*---
description: z3test's regression regressions/smt2/z3.5.smt2.
ref: regressions/smt2/z3.5.smt2
features:
  - z3test
outcome: unsat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-option :auto-config true)
(set-option :produce-models true)

(declare-const a Bool)
(declare-const b Bool)
(define-fun demorgan () Bool
    (= (and a b) (not (or (not a) (not b)))))
(assert (not demorgan))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
