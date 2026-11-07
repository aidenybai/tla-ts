(*---
description: z3test's regression regressions/smt2/t124.smt2.
ref: regressions/smt2/t124.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation

(set-option :print-success true)

(declare-datatypes (T) ((LispList nil (cons (car T) (cdr LispList)))))

(declare-const x (LispList Int))

(display (cons 10 nil))

(*--- recorded
all:
  exit: 0
  transcript: |-
    success
    success
    success
    (cons 10 nil)
---*)
