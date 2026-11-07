(*---
description: z3test's regression regressions/smt2/string11.smt2.
ref: regressions/smt2/string11.smt2
features:
  - z3test
outcome: sat
---*)
; Copyright (c) 2017 Microsoft Corporation
; issue #721
(set-option :smt.string_solver seq)
(set-option :model_validate true)
(declare-fun c0 () Bool)
(declare-fun c1 () String)
(define-fun e2 () String (ite c0 c1 ""))
(define-fun e3 () (RegEx String) (re.+ (re.range "0" "9")))
(assert (str.in.re e2 e3))
(assert (not (= "" e2)))
(check-sat)
;(get-model)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
