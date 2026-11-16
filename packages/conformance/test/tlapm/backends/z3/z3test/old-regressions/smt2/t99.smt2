(*---
description: z3test's regression old-regressions/smt2/t99.smt2.
ref: old-regressions/smt2/t99.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation



(declare-const x (_ BitVec 8))

(simplify (bvor x #b00110111))

(simplify (bvor #b00110111 x))

(simplify (bvor #b00111111 x))

(simplify (bvor #b00111000 x))

(declare-const b Bool)
(declare-const y (_ BitVec 8))

(simplify (bvor #b00111000 (ite b x y)))

(simplify (bvor #b11111000 x))

(simplify (bvor #b10101010 x))

(simplify (bvor #b01010101 x))

(simplify (bvand #b01010101 x))

(*--- recorded
all:
  exit: 0
  transcript: |-
    (concat ((_ extract 7 6) x) #b11 ((_ extract 3 3) x) #b111)
    (concat ((_ extract 7 6) x) #b11 ((_ extract 3 3) x) #b111)
    (concat ((_ extract 7 6) x) #b111111)
    (concat ((_ extract 7 6) x) #b111 ((_ extract 2 0) x))
    (concat (ite b ((_ extract 7 6) x) ((_ extract 7 6) y))
            #b111
            (ite b ((_ extract 2 0) x) ((_ extract 2 0) y)))
    (concat #b11111 ((_ extract 2 0) x))
    (concat #b1
            ((_ extract 6 6) x)
            #b1
            ((_ extract 4 4) x)
            #b1
            ((_ extract 2 2) x)
            #b1
            ((_ extract 0 0) x))
    (concat ((_ extract 7 7) x)
            #b1
            ((_ extract 5 5) x)
            #b1
            ((_ extract 3 3) x)
            #b1
            ((_ extract 1 1) x)
            #b1)
    (concat #b0
            ((_ extract 6 6) x)
            #b0
            ((_ extract 4 4) x)
            #b0
            ((_ extract 2 2) x)
            #b0
            ((_ extract 0 0) x))
---*)
