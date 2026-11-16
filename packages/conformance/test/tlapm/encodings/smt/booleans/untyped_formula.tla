(*---
description: A declared constant used as a formula is cast to Bool.
ref: src/type/t_synth.ml#main
mode: encoding
outcome: proved
---*)
---- MODULE untyped_formula ----
EXTENDS TLAPS
THEOREM ASSUME NEW p, NEW q, p, p => q PROVE q
  BY SMT
====

(*--- recorded
all:
  exit: 0
  transcript: "@type: obligation\n@id: 1\n@loc: 10:3:10:5\n@status: to be proved\n\n@type: obligation\n@id: 1\n@loc: 10:3:10:5\n@status: proved\n@prover: smt\n@meth: time-limit: 5\n@already: false\n\n@type: obligation\n@id: 2\n@loc: 10:6:10:9\n@status: to be proved\n\n@type: obligation\n@id: 2\n@loc: 10:6:10:9\n@status: trivial\n@prover: tlapm\n@already: false\n\n@type: obligationsnumber\n@count: 2\n\nFile \"./untyped_formula.tla\", line 7, character 1 to line 11, character 4:\n[INFO]: All 2 obligations proved.\n\n--- isabelle\n(* automatically generated -- do not edit manually *)\ntheory untyped_formula imports Constant Zenon begin\nML_command \\<open> writeln (\"*** TLAPS PARSED\\n\"); \\<close>\nconsts\n  \"isReal\" :: c\n  \"isa_slas_a\" :: \"[c,c] => c\"\n  \"isa_bksl_diva\" :: \"[c,c] => c\"\n  \"isa_perc_a\" :: \"[c,c] => c\"\n  \"isa_peri_peri_a\" :: \"[c,c] => c\"\n  \"isInfinity\" :: c\n  \"isa_lbrk_rbrk_a\" :: \"[c] => c\"\n  \"isa_less_more_a\" :: \"[c] => c\"\n\nend\n\n--- z3\n;; Proof obligation:\n;;\tASSUME NEW CONSTANT CONSTANT_p_,\n;;\t       NEW CONSTANT CONSTANT_q_,\n;;\t       CONSTANT_p_ ,\n;;\t       CONSTANT_p_ => CONSTANT_q_ \n;;\tPROVE  CONSTANT_q_\n;; TLA+ Proof Manager b91fb6c\n;; Proof obligation #1\n;; Generated from file \"./untyped_formula.tla\", line 10, characters 3-4\n\n(set-logic UFNIA)\n\n;; Sorts\n\n(declare-sort Idv 0)\n\n;; Hypotheses\n\n(declare-fun smt__TLA____Tt__Idv () Idv)\n\n; hidden fact\n\n; hidden fact\n\n; omitted declaration of 'CONSTANT_EnabledWrapper_' (second-order)\n\n; omitted declaration of 'CONSTANT_CdotWrapper_' (second-order)\n\n(declare-fun smt__CONSTANT__p__ () Idv)\n\n(declare-fun smt__CONSTANT__q__ () Idv)\n\n(assert (= smt__CONSTANT__p__ smt__TLA____Tt__Idv))\n\n(assert\n  (=> (= smt__CONSTANT__p__ smt__TLA____Tt__Idv)\n    (= smt__CONSTANT__q__ smt__TLA____Tt__Idv)))\n\n;; Goal\n(assert (! (not (= smt__CONSTANT__q__ smt__TLA____Tt__Idv)) :named |Goal|))\n\n(check-sat)\n(exit)"
---*)
