(*---
description: z3test's regression regressions/smt2/chain.smt2.
ref: regressions/smt2/chain.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation


(declare-const a Real)
(declare-const b Real)
(declare-const c Real)

(display (< a b c))
(display (<= a b c))
(display (> a b c))
(display (>= a b c))

(declare-const d Real)

(display (< a b c d))
(display (<= a b c d))
(display (> a b c d))
(display (>= a b c d))

(reset)

(declare-const a Int)
(declare-const b Int)
(declare-const c Int)

(display (< a b c))
(display (<= a b c))
(display (> a b c))
(display (>= a b c))

(declare-const d Int)

(display (< a b c d))
(display (<= a b c d))
(display (> a b c d))
(display (>= a b c d))

(*--- recorded
all:
  exit: 0
  transcript: |-
    (and (< a b) (< b c))
    (and (<= a b) (<= b c))
    (and (> a b) (> b c))
    (and (>= a b) (>= b c))
    (and (< a b) (< b c) (< c d))
    (and (<= a b) (<= b c) (<= c d))
    (and (> a b) (> b c) (> c d))
    (and (>= a b) (>= b c) (>= c d))
    (and (< a b) (< b c))
    (and (<= a b) (<= b c))
    (and (> a b) (> b c))
    (and (>= a b) (>= b c))
    (and (< a b) (< b c) (< c d))
    (and (<= a b) (<= b c) (<= c d))
    (and (> a b) (> b c) (> c d))
    (and (>= a b) (>= b c) (>= c d))
---*)
