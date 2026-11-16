(*---
description: z3test's regression old-regressions/smt2/t72.smt2.
ref: old-regressions/smt2/t72.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation


(set-option :pp.flat-assoc false)
(set-option :pp.max-depth 100)

(declare-const p1 Bool)
(declare-const p2 Bool)
(declare-const p3 Bool)
(declare-const p4 Bool)

(simplify (or p1 (and p2 p1))
          :elim-and true
          :local-ctx true)

(simplify (or p1 (and p2 p1) p3)
          :elim-and true
          :local-ctx true)

(simplify (or p1 (and p2 p1) (and p3 p2) p3)
          :elim-and true
          :local-ctx true)

(simplify (or p1 (and p2 p1) (and p3 p2) p3 p4) 
          :elim-and true
          :local-ctx true)

(simplify (or p1 (and (or p2 p3) (not p1)))
          :elim-and true
          :local-ctx true)


(simplify (or p1 p2 (and (not p1) (not p2)))
          :elim-and true
          :local-ctx true)

(simplify (or p1 p2 (and (not p1) (not p2) p3))
          :elim-and true
          :local-ctx true)

(simplify (or p1 p2 (and (not p1) (not p2) p3) (and p1 p2))
          :elim-and true
          :local-ctx true)

(simplify (or (not p1) (and p1 p2))
          :elim-and true
          :local-ctx true)

(simplify (or (not p1) (and (not p1) p2))
          :elim-and true
          :local-ctx true)

(simplify (or (not p1) (and (not p1) p2) (and p3 (not p1)))
          :elim-and true
          :local-ctx true)

(simplify (or (not p1) (and (not p1) p2) (and p3 (not p1)) (and p1 p2))
          :elim-and true
          :local-ctx true)

(simplify (or p1 (and (or p2 p3 (and (not p1) p4)) (not p1)))
          :elim-and true
          :local-ctx true)

(*--- recorded
all:
  exit: 0
  transcript: |-
    p1
    (or p1 p3)
    (or p1 p3)
    (or p1 p3 p4)
    (or p1 p2 p3)
    true
    (or p1 p2 p3)
    (or p1 p2 p3)
    (or (not p1) p2)
    (not p1)
    (not p1)
    (or (not p1) p2)
    (or p1 p2 p3 p4)
---*)
