(*---
description: z3test's regression regressions/smt2/t117.smt2.
ref: regressions/smt2/t117.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation


(declare-const a (_ BitVec 32))
(declare-const b (_ BitVec 4))

(simplify (bvsle b #x5))
(simplify (bvule b #x5))
(simplify (bvule b (concat #b00 #b00)))
(simplify (bvule a #x00000000))
(simplify (bvule a #x00001e80))
(simplify (bvsle a #x00001e80))
(simplify (bvule #x00001e80 a))

(*--- recorded
all:
  exit: 0
  transcript: |-
    (bvsle b #x5)
    (and (= ((_ extract 3 3) b) #b0) (bvule ((_ extract 2 0) b) #b101))
    (= b #x0)
    (= a #x00000000)
    (and (= ((_ extract 31 13) a) #b0000000000000000000)
         (bvule ((_ extract 12 0) a) #b1111010000000))
    (bvsle a #x00001e80)
    (or (not (= ((_ extract 31 13) a) #b0000000000000000000))
        (bvule #b1111010000000 ((_ extract 12 0) a)))
---*)
