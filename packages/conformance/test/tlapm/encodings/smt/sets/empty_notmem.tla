(*---
description: x \notin S becomes ~(x \in S), and {} is the empty enumeration.
ref: src/encode/n_rewrite.ml#elim_notmem
mode: encoding
outcome: proved
---*)
---- MODULE empty_notmem ----
EXTENDS TLAPS
THEOREM ASSUME NEW a PROVE a \notin {}
  BY SMT
====

(*--- recorded
all:
  exit: 0
  transcript: "@type: obligation\n@id: 1\n@loc: 10:3:10:5\n@status: to be proved\n\n@type: obligation\n@id: 1\n@loc: 10:3:10:5\n@status: proved\n@prover: smt\n@meth: time-limit: 5\n@already: false\n\n@type: obligation\n@id: 2\n@loc: 10:6:10:9\n@status: to be proved\n\n@type: obligation\n@id: 2\n@loc: 10:6:10:9\n@status: trivial\n@prover: tlapm\n@already: false\n\n@type: obligationsnumber\n@count: 2\n\nFile \"./empty_notmem.tla\", line 7, character 1 to line 11, character 4:\n[INFO]: All 2 obligations proved.\n\n--- isabelle\n(* automatically generated -- do not edit manually *)\ntheory empty_notmem imports Constant Zenon begin\nML_command \\<open> writeln (\"*** TLAPS PARSED\\n\"); \\<close>\nconsts\n  \"isReal\" :: c\n  \"isa_slas_a\" :: \"[c,c] => c\"\n  \"isa_bksl_diva\" :: \"[c,c] => c\"\n  \"isa_perc_a\" :: \"[c,c] => c\"\n  \"isa_peri_peri_a\" :: \"[c,c] => c\"\n  \"isInfinity\" :: c\n  \"isa_lbrk_rbrk_a\" :: \"[c] => c\"\n  \"isa_less_more_a\" :: \"[c] => c\"\n\nend\n\n--- z3\n;; Proof obligation:\n;;\tASSUME NEW CONSTANT CONSTANT_a_\n;;\tPROVE  CONSTANT_a_ \\notin {}\n;; TLA+ Proof Manager b91fb6c\n;; Proof obligation #1\n;; Generated from file \"./empty_notmem.tla\", line 10, characters 3-4\n\n(set-logic UFNIA)\n\n;; Sorts\n\n(declare-sort Idv 0)\n\n;; Hypotheses\n\n(declare-fun smt__TLA____Mem (Idv Idv) Bool)\n\n(declare-fun smt__TLA____SetEnum__0 () Idv)\n\n(declare-fun smt__TLA____SetExtTrigger (Idv Idv) Bool)\n\n;; Axiom: SetExt\n(assert\n  (!\n    (forall ((smt__x Idv) (smt__y Idv))\n      (!\n        (=>\n          (forall ((smt__z Idv))\n            (= (smt__TLA____Mem smt__z smt__x)\n              (smt__TLA____Mem smt__z smt__y))) (= smt__x smt__y))\n        :pattern ((smt__TLA____SetExtTrigger smt__x smt__y))))\n    :named |SetExt|))\n\n;; Axiom: EnumDefElim 0\n(assert\n  (!\n    (forall ((smt__x Idv))\n      (! (not (smt__TLA____Mem smt__x smt__TLA____SetEnum__0))\n        :pattern ((smt__TLA____Mem smt__x smt__TLA____SetEnum__0))))\n    :named |EnumDefElim 0|))\n\n; hidden fact\n\n; hidden fact\n\n; omitted declaration of 'CONSTANT_EnabledWrapper_' (second-order)\n\n; omitted declaration of 'CONSTANT_CdotWrapper_' (second-order)\n\n(declare-fun smt__CONSTANT__a__ () Idv)\n\n;; Goal\n(assert\n  (! (not (not (smt__TLA____Mem smt__CONSTANT__a__ smt__TLA____SetEnum__0)))\n    :named |Goal|))\n\n(check-sat)\n(exit)"
---*)
