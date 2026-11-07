(*---
description: z3test's regression old-regressions/smt2/t91.smt2.
ref: old-regressions/smt2/t91.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation

(set-option :produce-models true)
(declare-const x (_ BitVec 8))
(declare-const y (_ BitVec 8))

(assert (bvsle x #x0a))
(assert (bvsle y #x0a))
(assert (bvsle y x))

(apply elim-uncnstr :print-model-converter true)
(reset)

(set-option :produce-models true)
(declare-const x (_ BitVec 8))
(declare-const y (_ BitVec 8))

(assert (bvsle x #x0a))
(assert (bvsle y #x0a))
(assert (bvsle x y))

(apply elim-uncnstr :print-model-converter true)
(reset)

(set-option :produce-models true)
(declare-const x (_ BitVec 8))
(declare-const y (_ BitVec 8))

(assert (bvsle x #x0a))
(assert (bvsle y #x0a))
(assert (bvule y x))

(apply elim-uncnstr :print-model-converter true)
(reset)

(set-option :produce-models true)
(declare-const x (_ BitVec 8))
(declare-const y (_ BitVec 8))

(assert (bvsle x #x0a))
(assert (bvsle y #x0a))
(assert (bvule x y))

(apply elim-uncnstr :print-model-converter true)
(reset)

(*--- recorded
all:
  exit: 0
  transcript: |-
    (goals
    (goal
      (bvsle x #x0a)
      (bvsle y #x0a)
      (bvsle y x)
      :precision precise :depth 0)
    )
    (goals
    (goal
      (bvsle x #x0a)
      (bvsle y #x0a)
      (bvsle x y)
      :precision precise :depth 0)
    )
    (goals
    (goal
      (bvsle x #x0a)
      (bvsle y #x0a)
      (bvule y x)
      :precision precise :depth 0)
    )
    (goals
    (goal
      (bvsle x #x0a)
      (bvsle y #x0a)
      (bvule x y)
      :precision precise :depth 0)
    )
---*)
