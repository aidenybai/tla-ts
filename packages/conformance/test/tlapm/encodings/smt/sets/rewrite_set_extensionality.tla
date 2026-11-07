(*---
description: With --debug rwsetext, an equality of sets in a positive position is rewritten to a quantified equivalence of memberships.
ref: src/encode/n_rewrite.ml#apply_ext
mode: encoding
args: ['--debug', rwsetext]
outcome: proved
---*)
---- MODULE rewrite_set_extensionality ----
EXTENDS TLAPS
THEOREM ASSUME NEW S, NEW T PROVE S \cup T = T \cup S
  BY SMT
====

(*--- recorded
all:
  exit: 0
  transcript: "@type: obligation\n@id: 1\n@loc: 11:3:11:5\n@status: to be proved\n\n@type: obligation\n@id: 1\n@loc: 11:3:11:5\n@status: proved\n@prover: smt\n@meth: time-limit: 5\n@already: false\n\n@type: obligation\n@id: 2\n@loc: 11:6:11:9\n@status: to be proved\n\n@type: obligation\n@id: 2\n@loc: 11:6:11:9\n@status: trivial\n@prover: tlapm\n@already: false\n\n@type: obligationsnumber\n@count: 2\n\nFile \"./rewrite_set_extensionality.tla\", line 8, character 1 to line 12, character 4:\n[INFO]: All 2 obligations proved.\n\n--- isabelle\n(* automatically generated -- do not edit manually *)\ntheory rewrite_set_extensionality imports Constant Zenon begin\nML_command \\<open> writeln (\"*** TLAPS PARSED\\n\"); \\<close>\nconsts\n  \"isReal\" :: c\n  \"isa_slas_a\" :: \"[c,c] => c\"\n  \"isa_bksl_diva\" :: \"[c,c] => c\"\n  \"isa_perc_a\" :: \"[c,c] => c\"\n  \"isa_peri_peri_a\" :: \"[c,c] => c\"\n  \"isInfinity\" :: c\n  \"isa_lbrk_rbrk_a\" :: \"[c] => c\"\n  \"isa_less_more_a\" :: \"[c] => c\"\n\nend\n\n--- z3\n;; Proof obligation:\n;;\tASSUME NEW CONSTANT CONSTANT_S_,\n;;\t       NEW CONSTANT CONSTANT_T_\n;;\tPROVE  CONSTANT_S_ \\cup CONSTANT_T_ = CONSTANT_T_ \\cup CONSTANT_S_\n;; TLA+ Proof Manager b91fb6c\n;; Proof obligation #1\n;; Generated from file \"./rewrite_set_extensionality.tla\", line 11, characters 3-4\n\n(set-logic UFNIA)\n\n;; Sorts\n\n(declare-sort Idv 0)\n\n;; Hypotheses\n\n(declare-fun smt__TLA____Cup (Idv Idv) Idv)\n\n(declare-fun smt__TLA____Mem (Idv Idv) Bool)\n\n(declare-fun smt__TLA____SetExtTrigger (Idv Idv) Bool)\n\n;; Axiom: SetExt\n(assert\n  (!\n    (forall ((smt__x Idv) (smt__y Idv))\n      (!\n        (=>\n          (forall ((smt__z Idv))\n            (= (smt__TLA____Mem smt__z smt__x)\n              (smt__TLA____Mem smt__z smt__y))) (= smt__x smt__y))\n        :pattern ((smt__TLA____SetExtTrigger smt__x smt__y))))\n    :named |SetExt|))\n\n;; Axiom: CupDef\n(assert\n  (!\n    (forall ((smt__a Idv) (smt__b Idv) (smt__x Idv))\n      (!\n        (= (smt__TLA____Mem smt__x (smt__TLA____Cup smt__a smt__b))\n          (or (smt__TLA____Mem smt__x smt__a) (smt__TLA____Mem smt__x smt__b)))\n        :pattern ((smt__TLA____Mem smt__x (smt__TLA____Cup smt__a smt__b)))\n        :pattern ((smt__TLA____Mem smt__x smt__a)\n                   (smt__TLA____Cup smt__a smt__b))\n        :pattern ((smt__TLA____Mem smt__x smt__b)\n                   (smt__TLA____Cup smt__a smt__b)))) :named |CupDef|))\n\n; hidden fact\n\n; hidden fact\n\n; omitted declaration of 'CONSTANT_EnabledWrapper_' (second-order)\n\n; omitted declaration of 'CONSTANT_CdotWrapper_' (second-order)\n\n(declare-fun smt__CONSTANT__S__ () Idv)\n\n(declare-fun smt__CONSTANT__T__ () Idv)\n\n;; Goal\n(assert\n  (!\n    (not\n      (forall ((smt__x Idv))\n        (=\n          (smt__TLA____Mem smt__x\n            (smt__TLA____Cup smt__CONSTANT__S__ smt__CONSTANT__T__))\n          (smt__TLA____Mem smt__x\n            (smt__TLA____Cup smt__CONSTANT__T__ smt__CONSTANT__S__)))))\n    :named |Goal|))\n\n(check-sat)\n(exit)"
---*)
