(*---
description: z3test's regression regressions/smt2/t104.smt2.
ref: regressions/smt2/t104.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation


(set-option :produce-models true)

(declare-const l1 Bool)
(declare-const l2 Bool)
(declare-const l3 Bool)
(declare-const l4 Bool)
(simplify (or l1 (and l1 l2))
          :local-ctx true
          :elim-and true)
(simplify (or l1 (and (not l1) l2))
          :local-ctx true
          :elim-and true)
(simplify (or l1 (xor l1 l2))
          :local-ctx true)
(simplify (or l1 (iff l1 l2))
          :local-ctx true)
(simplify (or (not l1) (not (iff l1 l2)))
          :local-ctx true)

(simplify (or l1 (xor l2 l1))
          :local-ctx true)
(simplify (or l1 (iff l2 l1))
          :local-ctx true)
(simplify (or (not l1) (not (iff l2 l1)))
          :local-ctx true)

(simplify (or l1 (ite l1 l2 l3))
          :local-ctx true)

(simplify (or (not l1) (ite l1 l2 l3))
          :local-ctx true)

(simplify (or l1 (ite (not l1) l2 l3))
          :local-ctx true)

(simplify (or l1 (not (ite l1 l2 l3)))
          :local-ctx true)

(simplify (or l1 (ite l2 l1 l3))
          :local-ctx true
          :elim-and true)

(simplify (or l1 (not (ite l2 l1 l3)))
          :local-ctx true
          :elim-and true)

(simplify (or (not l1) (ite l2 l1 l3))
          :local-ctx true
          :elim-and true)

(simplify (or l1 (ite l2 l3 l1))
          :local-ctx true
          :elim-and true)

(simplify (or l1 (not (ite l2 l3 l1)))
          :local-ctx true
          :elim-and true)

(*--- recorded
all:
  exit: 0
  transcript: |-
    l1
    (or l1 l2)
    (or l1 l2)
    (or l1 (not l2))
    (or (not l1) (not l2))
    (or l1 l2)
    (or l1 (not l2))
    (or (not l1) (not l2))
    (or l1 l3)
    (or (not l1) l2)
    (or l1 l2)
    (or l1 (not l3))
    (or l1 (not (or l2 (not l3))))
    (or l1 l2 (not l3))
    (or (not l1) l2 l3)
    (or l1 (not (or (not l2) (not l3))))
    (or l1 (not l2) (not l3))
---*)
