(*---
description: By default, a hypothesis that is a conjunction of equalities is split into one hypothesis per equality.
ref: src/backend/prep.ml#flatten
mode: encoding
outcome: proved
---*)
---- MODULE flatten ----
EXTENDS TLAPS
THEOREM ASSUME NEW a, NEW b, NEW c, a = b /\ b = c PROVE a = c
  BY SMT
====

(*--- recorded
all:
  exit: 0
  transcript: "@type: obligation\n@id: 1\n@loc: 10:3:10:5\n@status: to be proved\n\n@type: obligation\n@id: 1\n@loc: 10:3:10:5\n@status: proved\n@prover: smt\n@meth: time-limit: 5\n@already: false\n\n@type: obligation\n@id: 2\n@loc: 10:6:10:9\n@status: to be proved\n\n@type: obligation\n@id: 2\n@loc: 10:6:10:9\n@status: trivial\n@prover: tlapm\n@already: false\n\n@type: obligationsnumber\n@count: 2\n\nFile \"./flatten.tla\", line 7, character 1 to line 11, character 4:\n[INFO]: All 2 obligations proved.\n\n--- isabelle\n(* automatically generated -- do not edit manually *)\ntheory flatten imports Constant Zenon begin\nML_command \\<open> writeln (\"*** TLAPS PARSED\\n\"); \\<close>\nconsts\n  \"isReal\" :: c\n  \"isa_slas_a\" :: \"[c,c] => c\"\n  \"isa_bksl_diva\" :: \"[c,c] => c\"\n  \"isa_perc_a\" :: \"[c,c] => c\"\n  \"isa_peri_peri_a\" :: \"[c,c] => c\"\n  \"isInfinity\" :: c\n  \"isa_lbrk_rbrk_a\" :: \"[c] => c\"\n  \"isa_less_more_a\" :: \"[c] => c\"\n\nend\n\n--- z3\n;; Proof obligation:\n;;\tASSUME NEW CONSTANT CONSTANT_a_,\n;;\t       NEW CONSTANT CONSTANT_b_,\n;;\t       NEW CONSTANT CONSTANT_c_,\n;;\t       CONSTANT_a_ = CONSTANT_b_ ,\n;;\t       CONSTANT_b_ = CONSTANT_c_ \n;;\tPROVE  CONSTANT_a_ = CONSTANT_c_\n;; TLA+ Proof Manager b91fb6c\n;; Proof obligation #1\n;; Generated from file \"./flatten.tla\", line 10, characters 3-4\n\n(set-logic UFNIA)\n\n;; Sorts\n\n(declare-sort Idv 0)\n\n;; Hypotheses\n\n; hidden fact\n\n; hidden fact\n\n; omitted declaration of 'CONSTANT_EnabledWrapper_' (second-order)\n\n; omitted declaration of 'CONSTANT_CdotWrapper_' (second-order)\n\n(declare-fun smt__CONSTANT__a__ () Idv)\n\n(declare-fun smt__CONSTANT__b__ () Idv)\n\n(declare-fun smt__CONSTANT__c__ () Idv)\n\n(assert (= smt__CONSTANT__a__ smt__CONSTANT__b__))\n\n(assert (= smt__CONSTANT__b__ smt__CONSTANT__c__))\n\n;; Goal\n(assert (! (not (= smt__CONSTANT__a__ smt__CONSTANT__c__)) :named |Goal|))\n\n(check-sat)\n(exit)"
---*)
