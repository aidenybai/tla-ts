(*---
description: z3test's regression regressions/smt2/t109.smt2.
ref: regressions/smt2/t109.smt2
features:
  - z3test
outcome: sat
---*)

; Copyright (c) 2015 Microsoft Corporation

(set-option :produce-models true)

(declare-const mySet (Array Int Bool))

(assert (let ((empty ((as const (Array Int Bool)) false)))
        (let ((fortytwo (store empty 42 true)))
        (let ((fortythree (store fortytwo 43 true)))
          (= mySet ((_ map or) fortytwo fortythree))))))
(check-sat)
(eval (select mySet 43))
(eval (select mySet 42))
(eval (select mySet 44))

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    true
    true
    false
---*)
