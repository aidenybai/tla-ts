(*---
description: A fact cited in BY becomes a named hypothesis.
ref: src/backend/smtlib.ml#pp_print_obligation
mode: encoding
outcome: proved
---*)
---- MODULE cited_fact ----
EXTENDS TLAPS
CONSTANT S, a
AXIOM Ax == a \in S
THEOREM a \in S
  BY Ax, SMT
====

(*--- recorded
all:
  exit: 0
  transcript: "@type: obligation\n@id: 1\n@loc: 12:3:12:5\n@status: to be proved\n\n@type: obligation\n@id: 1\n@loc: 12:3:12:5\n@status: proved\n@prover: smt\n@meth: time-limit: 5\n@already: false\n\n@type: obligation\n@id: 2\n@loc: 12:6:12:8\n@status: to be proved\n\n@type: obligation\n@id: 2\n@loc: 12:6:12:8\n@status: trivial\n@prover: tlapm\n@already: false\n\n@type: obligation\n@id: 3\n@loc: 12:10:12:13\n@status: to be proved\n\n@type: obligation\n@id: 3\n@loc: 12:10:12:13\n@status: trivial\n@prover: tlapm\n@already: false\n\n@type: obligationsnumber\n@count: 3\n\nFile \"./cited_fact.tla\", line 7, character 1 to line 13, character 4:\n[INFO]: All 3 obligations proved.\n\n--- isabelle\n(* automatically generated -- do not edit manually *)\ntheory cited_fact imports Constant Zenon begin\nML_command \\<open> writeln (\"*** TLAPS PARSED\\n\"); \\<close>\nconsts\n  \"isReal\" :: c\n  \"isa_slas_a\" :: \"[c,c] => c\"\n  \"isa_bksl_diva\" :: \"[c,c] => c\"\n  \"isa_perc_a\" :: \"[c,c] => c\"\n  \"isa_peri_peri_a\" :: \"[c,c] => c\"\n  \"isInfinity\" :: c\n  \"isa_lbrk_rbrk_a\" :: \"[c] => c\"\n  \"isa_less_more_a\" :: \"[c] => c\"\n\nend\n\n--- z3\n;; Proof obligation:\n;;\tASSUME NEW CONSTANT CONSTANT_S_,\n;;\t       NEW CONSTANT CONSTANT_a_,\n;;\t       CONSTANT_a_ \\in CONSTANT_S_ \n;;\tPROVE  CONSTANT_a_ \\in CONSTANT_S_\n;; TLA+ Proof Manager b91fb6c\n;; Proof obligation #1\n;; Generated from file \"./cited_fact.tla\", line 12, characters 3-4\n\n(set-logic UFNIA)\n\n;; Sorts\n\n(declare-sort Idv 0)\n\n;; Hypotheses\n\n(declare-fun smt__TLA____Mem (Idv Idv) Bool)\n\n(declare-fun smt__TLA____SetExtTrigger (Idv Idv) Bool)\n\n;; Axiom: SetExt\n(assert\n  (!\n    (forall ((smt__x Idv) (smt__y Idv))\n      (!\n        (=>\n          (forall ((smt__z Idv))\n            (= (smt__TLA____Mem smt__z smt__x)\n              (smt__TLA____Mem smt__z smt__y))) (= smt__x smt__y))\n        :pattern ((smt__TLA____SetExtTrigger smt__x smt__y))))\n    :named |SetExt|))\n\n; hidden fact\n\n; hidden fact\n\n; omitted declaration of 'CONSTANT_EnabledWrapper_' (second-order)\n\n; omitted declaration of 'CONSTANT_CdotWrapper_' (second-order)\n\n(declare-fun smt__CONSTANT__S__ () Idv)\n\n(declare-fun smt__CONSTANT__a__ () Idv)\n\n; hidden fact\n\n(assert (smt__TLA____Mem smt__CONSTANT__a__ smt__CONSTANT__S__))\n\n;; Goal\n(assert\n  (! (not (smt__TLA____Mem smt__CONSTANT__a__ smt__CONSTANT__S__))\n    :named |Goal|))\n\n(check-sat)\n(exit)"
---*)
