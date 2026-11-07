(*---
description: Distinct string literals get the StrLitDistinct axiom.
ref: src/encode/n_axiomatize.ml#main
mode: encoding
outcome: proved
---*)
---- MODULE literals_distinct ----
EXTENDS TLAPS
THEOREM "a" # "b"
  BY SMT
====

(*--- recorded
all:
  exit: 0
  transcript: "@type: obligation\n@id: 1\n@loc: 10:3:10:5\n@status: to be proved\n\n@type: obligation\n@id: 1\n@loc: 10:3:10:5\n@status: proved\n@prover: smt\n@meth: time-limit: 5\n@already: false\n\n@type: obligation\n@id: 2\n@loc: 10:6:10:9\n@status: to be proved\n\n@type: obligation\n@id: 2\n@loc: 10:6:10:9\n@status: trivial\n@prover: tlapm\n@already: false\n\n@type: obligationsnumber\n@count: 2\n\nFile \"./literals_distinct.tla\", line 7, character 1 to line 11, character 4:\n[INFO]: All 2 obligations proved.\n\n--- isabelle\n(* automatically generated -- do not edit manually *)\ntheory literals_distinct imports Constant Zenon begin\nML_command \\<open> writeln (\"*** TLAPS PARSED\\n\"); \\<close>\nconsts\n  \"isReal\" :: c\n  \"isa_slas_a\" :: \"[c,c] => c\"\n  \"isa_bksl_diva\" :: \"[c,c] => c\"\n  \"isa_perc_a\" :: \"[c,c] => c\"\n  \"isa_peri_peri_a\" :: \"[c,c] => c\"\n  \"isInfinity\" :: c\n  \"isa_lbrk_rbrk_a\" :: \"[c] => c\"\n  \"isa_less_more_a\" :: \"[c] => c\"\n\nend\n\n--- z3\n;; Proof obligation:\n;;\t\"a\" # \"b\"\n;; TLA+ Proof Manager b91fb6c\n;; Proof obligation #1\n;; Generated from file \"./literals_distinct.tla\", line 10, characters 3-4\n\n(set-logic UFNIA)\n\n;; Sorts\n\n(declare-sort Idv 0)\n\n;; Hypotheses\n\n(declare-fun smt__TLA____Mem (Idv Idv) Bool)\n\n(declare-fun smt__TLA____SetExtTrigger (Idv Idv) Bool)\n\n(declare-fun smt__TLA____StrLit__a () Idv)\n\n(declare-fun smt__TLA____StrLit__b () Idv)\n\n(declare-fun smt__TLA____StrSet () Idv)\n\n;; Axiom: SetExt\n(assert\n  (!\n    (forall ((smt__x Idv) (smt__y Idv))\n      (!\n        (=>\n          (forall ((smt__z Idv))\n            (= (smt__TLA____Mem smt__z smt__x)\n              (smt__TLA____Mem smt__z smt__y))) (= smt__x smt__y))\n        :pattern ((smt__TLA____SetExtTrigger smt__x smt__y))))\n    :named |SetExt|))\n\n;; Axiom: StrLitIsstr a\n(assert\n  (! (smt__TLA____Mem smt__TLA____StrLit__a smt__TLA____StrSet)\n    :named |StrLitIsstr a|))\n\n;; Axiom: StrLitIsstr b\n(assert\n  (! (smt__TLA____Mem smt__TLA____StrLit__b smt__TLA____StrSet)\n    :named |StrLitIsstr b|))\n\n;; Axiom: StrLitDistinct b a\n(assert\n  (! (distinct smt__TLA____StrLit__b smt__TLA____StrLit__a)\n    :named |StrLitDistinct b a|))\n\n; hidden fact\n\n; hidden fact\n\n; omitted declaration of 'CONSTANT_EnabledWrapper_' (second-order)\n\n; omitted declaration of 'CONSTANT_CdotWrapper_' (second-order)\n\n;; Goal\n(assert\n  (! (not (distinct smt__TLA____StrLit__a smt__TLA____StrLit__b))\n    :named |Goal|))\n\n(check-sat)\n(exit)"
---*)
