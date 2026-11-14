(*---
description: z3test's regression regressions/smt2/t138.smt2.
ref: regressions/smt2/t138.smt2
features:
  - z3test
outcome: sat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-option :smt.macro-finder true)
(set-option :auto-config true)

(declare-datatypes () ((U unit1 unit2)))

(declare-fun f (U) U)
(declare-fun P (U) Bool)
(declare-fun Q (U) Bool)
(declare-const a U)

(assert (forall ((x U)) (= (= (f x) a) (or (P x) (Q x)))))

(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
