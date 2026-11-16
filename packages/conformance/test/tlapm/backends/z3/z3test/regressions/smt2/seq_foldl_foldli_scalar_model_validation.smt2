(*---
description: z3test's regression regressions/smt2/seq_foldl_foldli_scalar_model_validation.smt2.
ref: regressions/smt2/seq_foldl_foldli_scalar_model_validation.smt2
features:
  - z3test
outcome: sat
---*)
; Regression: seq.foldl / seq.foldli with scalar and array accumulators under
; model_validate. All four check-sat calls must be sat with valid models.
; Transferred from src/test/seq_rewriter.cpp (test_seq_foldl_foldli_scalar_model_validation).
(set-option :model_validate true)
(push)
(declare-fun f (Int Int) Int)
(declare-const il (Seq Int))
(assert (= (seq.foldl f 0 il) 5))
(check-sat)
(pop)
(push)
(declare-const il (Seq Int))
(declare-const F (Array Bool Int Bool))
(assert (= (seq.foldl F true il) true))
(assert (> (seq.len il) 0))
(assert (not (= F ((as const (Array Bool Int Bool)) true))))
(check-sat)
(pop)
(push)
(declare-fun f (Int Int Int) Int)
(declare-const il (Seq Int))
(assert (= (seq.foldli f 0 0 il) 5))
(check-sat)
(pop)
(push)
(declare-const il (Seq Int))
(declare-const F (Array Int Bool Int Bool))
(assert (= (seq.foldli F 5 true il) true))
(assert (> (seq.len il) 0))
(assert (not (= F ((as const (Array Int Bool Int Bool)) true))))
(check-sat)
(pop)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    sat
    sat
    sat
---*)
