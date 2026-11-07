(*---
description: z3test's regression old-regressions/smt2/t84.smt2.
ref: old-regressions/smt2/t84.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation

(declare-const a (_ BitVec 16))
(declare-const b (_ BitVec 16))

(simplify (bvmul a b))
(simplify (bvmul b a))
(simplify (= (bvmul a b) (bvmul b a)))
(simplify (= (bvmul a b) (bvadd #x0000 (bvmul b a))))

(*--- recorded
all:
  exit: 0
  transcript: |-
    (bvmul a b)
    (bvmul a b)
    true
    true
---*)
