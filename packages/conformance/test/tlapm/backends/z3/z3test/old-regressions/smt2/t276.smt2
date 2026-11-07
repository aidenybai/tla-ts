(*---
description: z3test's regression old-regressions/smt2/t276.smt2.
ref: old-regressions/smt2/t276.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation

(set-option :diagnostic-output-channel "stdout")
(declare-const a Int)
(declare-const b Int)

(assert (= (+ a b) 1))
(assert (> a 10))
(assert (< a 20))

(apply (echo "size: " size " num-exprs: " num-exprs " is-lia: " is-qflia) :print false)

(*--- recorded
all:
  exit: 0
  transcript: 'size: 3 num-exprs: 9 is-lia: 1'
---*)
