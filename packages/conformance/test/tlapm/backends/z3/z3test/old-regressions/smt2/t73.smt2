(*---
description: z3test's regression old-regressions/smt2/t73.smt2.
ref: old-regressions/smt2/t73.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation
(dbg-some-value Bool)
(dbg-some-value Int)
(dbg-some-value Real)
(dbg-some-value (_ BitVec 32))
(dbg-some-value (List Int))
(dbg-some-value (Array Int (Array Int (List Int))))

(declare-datatypes (T1 T2) ((Tuple (mk-tuple (first T1) (second T2)))))

(dbg-some-value (Tuple Int Real))

(dbg-some-value (Tuple Int (Array Int (Tuple Bool (_ BitVec 16)))))

(*--- recorded
all:
  exit: 0
  transcript: |-
    false
    0
    0.0
    #x00000000
    nil
    ((as const (Array Int (Array Int (List Int))))
      ((as const (Array Int (List Int))) nil))
    (mk-tuple 0 0.0)
    (mk-tuple 0
              ((as const (Array Int (Tuple Bool (_ BitVec 16))))
                (mk-tuple false #x0000)))
---*)
