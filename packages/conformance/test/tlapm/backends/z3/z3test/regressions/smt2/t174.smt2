(*---
description: z3test's regression regressions/smt2/t174.smt2.
ref: regressions/smt2/t174.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-logic BV)
(declare-fun x () (_ BitVec 16))
(declare-const t (Array (_ BitVec 16) (_ BitVec 16)))
(assert (= (select t #x0000) #x0000))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: |-
    (error "line 5 column 18: unknown sort 'Array'")
    (error "line 6 column 19: unknown constant t")
    sat
---*)
