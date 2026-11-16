(*---
description: z3test's regression regressions/smt2/t205.smt2.
ref: regressions/smt2/t205.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation

(simplify #xff)
(simplify #xfe)
(set-option :pp.bv-neg true)
(simplify #xff)
(simplify #xfe)
(set-option :pp.bv-literals false)
(simplify #xff)
(simplify #xfe)

(simplify (/ 1.0 3.0))
(simplify 2.0)
(simplify 2)
(set-option :pp.decimal true)
(simplify (/ 1.0 3.0))
(simplify 2.0)
(simplify 2)
(set-option :pp.decimal-precision 20)
(simplify (/ 1.0 3.0))
(simplify 2.0)
(simplify 2)

(*--- recorded
all:
  exit: 0
  transcript: |-
    #xff
    #xfe
    (bvneg #x01)
    (bvneg #x02)
    (bvneg (_ bv1 8))
    (bvneg (_ bv2 8))
    (/ 1.0 3.0)
    2.0
    2
    0.3333333333?
    2.0
    2
    0.33333333333333333333?
    2.0
    2
---*)
