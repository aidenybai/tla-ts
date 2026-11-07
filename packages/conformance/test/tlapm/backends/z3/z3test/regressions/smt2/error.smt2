(*---
description: z3test's regression regressions/smt2/error.smt2.
ref: regressions/smt2/error.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation

(get-info :error-behavior)
(get-option :smt.relevancy)
(get-option :error-behavior)
(define-const x Bool 10)
(set-option :error-behavior immediate-exit)
(get-option :error-behavior)
(define-const x Bool 10)
(echo "continued...")

(*--- recorded
all:
  exit: 0
  transcript: |-
    (:error-behavior continued-execution)
    2
    continued-execution
    (error "line 7 column 23: invalid constant definition, sort mismatch")
    immediate-exit
    (error "line 10 column 23: invalid constant definition, sort mismatch")
---*)
