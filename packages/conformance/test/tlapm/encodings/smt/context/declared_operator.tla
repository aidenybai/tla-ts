(*---
description: A declared constant operator is an uninterpreted function over Idv.
ref: src/backend/smtlib.ml#pp_print_obligation
mode: encoding
outcome: proved
---*)
---- MODULE declared_operator ----
EXTENDS TLAPS
CONSTANT F(_)
THEOREM \A x : F(x) = F(x)
  BY SMT
====

(*--- recorded
all:
  exit: 0
  transcript: "@type: obligation\n@id: 1\n@loc: 11:3:11:5\n@status: to be proved\n\n@type: obligation\n@id: 1\n@loc: 11:3:11:5\n@status: proved\n@prover: smt\n@meth: time-limit: 5\n@already: false\n\n@type: obligation\n@id: 2\n@loc: 11:6:11:9\n@status: to be proved\n\n@type: obligation\n@id: 2\n@loc: 11:6:11:9\n@status: trivial\n@prover: tlapm\n@already: false\n\n@type: obligationsnumber\n@count: 2\n\nFile \"./declared_operator.tla\", line 7, character 1 to line 12, character 4:\n[INFO]: All 2 obligations proved.\n\n--- isabelle\n(* automatically generated -- do not edit manually *)\ntheory declared_operator imports Constant Zenon begin\nML_command \\<open> writeln (\"*** TLAPS PARSED\\n\"); \\<close>\nconsts\n  \"isReal\" :: c\n  \"isa_slas_a\" :: \"[c,c] => c\"\n  \"isa_bksl_diva\" :: \"[c,c] => c\"\n  \"isa_perc_a\" :: \"[c,c] => c\"\n  \"isa_peri_peri_a\" :: \"[c,c] => c\"\n  \"isInfinity\" :: c\n  \"isa_lbrk_rbrk_a\" :: \"[c] => c\"\n  \"isa_less_more_a\" :: \"[c] => c\"\n\nend\n\n--- z3\n;; Proof obligation:\n;;\tASSUME NEW CONSTANT CONSTANT_F_(_)\n;;\tPROVE  \\A CONSTANT_x_ : CONSTANT_F_(CONSTANT_x_) = CONSTANT_F_(CONSTANT_x_)\n;; TLA+ Proof Manager b91fb6c\n;; Proof obligation #1\n;; Generated from file \"./declared_operator.tla\", line 11, characters 3-4\n\n(set-logic UFNIA)\n\n;; Sorts\n\n(declare-sort Idv 0)\n\n;; Hypotheses\n\n; hidden fact\n\n; hidden fact\n\n; omitted declaration of 'CONSTANT_EnabledWrapper_' (second-order)\n\n; omitted declaration of 'CONSTANT_CdotWrapper_' (second-order)\n\n(declare-fun smt__CONSTANT__F__ (Idv) Idv)\n\n;; Goal\n(assert\n  (!\n    (not\n      (forall ((smt__CONSTANT__x__ Idv))\n        (= (smt__CONSTANT__F__ smt__CONSTANT__x__)\n          (smt__CONSTANT__F__ smt__CONSTANT__x__)))) :named |Goal|))\n\n(check-sat)\n(exit)"
---*)
