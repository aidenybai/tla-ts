(*---
description: z3test's regression old-regressions/smt2/t57.smt2.
ref: old-regressions/smt2/t57.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation
(define-sort W () (_ BitVec 16))
(declare-const c1 W)
(declare-const c2 W)

(simplify (bvredor #x0010))
(simplify (bvredor #x0000))
(simplify (bvredand #x0010))
(simplify (bvredand #x0000))
(simplify (bvredand #xffff))
(simplify (bvcomp c1 c1))
(simplify (bvcomp #x01 #x02))
(simplify (bvcomp #x01 #x01))
(simplify (bvcomp c1 c2))
(simplify (bvredor c1))
(simplify (bvredand c2))

(*--- recorded
all:
  exit: 0
  transcript: |-
    #b1
    #b0
    #b0
    #b0
    #b1
    #b1
    #b0
    #b1
    (ite (= c1 c2) #b1 #b0)
    (bvredor c1)
    (bvredand c2)
---*)
