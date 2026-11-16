(*---
description: Priming an expression distributes the prime over its variables.
ref: src/frontend/action.ml#process_obligation
mode: encoding
outcome: proved
---*)
---- MODULE primed_expression ----
EXTENDS TLAPS
VARIABLE x, y
THEOREM (x = y)' => x' = y'
  BY SMT
====

(*--- recorded
all:
  exit: 0
  transcript: "@type: obligation\n@id: 1\n@loc: 11:3:11:5\n@status: to be proved\n\n@type: obligation\n@id: 1\n@loc: 11:3:11:5\n@status: proved\n@prover: smt\n@meth: time-limit: 5\n@already: false\n\n@type: obligation\n@id: 2\n@loc: 11:6:11:9\n@status: to be proved\n\n@type: obligation\n@id: 2\n@loc: 11:6:11:9\n@status: trivial\n@prover: tlapm\n@already: false\n\n@type: obligationsnumber\n@count: 2\n\nFile \"./primed_expression.tla\", line 7, character 1 to line 12, character 4:\n[INFO]: All 2 obligations proved.\n\n--- isabelle\n(* automatically generated -- do not edit manually *)\ntheory primed_expression imports Constant Zenon begin\nML_command \\<open> writeln (\"*** TLAPS PARSED\\n\"); \\<close>\nconsts\n  \"isReal\" :: c\n  \"isa_slas_a\" :: \"[c,c] => c\"\n  \"isa_bksl_diva\" :: \"[c,c] => c\"\n  \"isa_perc_a\" :: \"[c,c] => c\"\n  \"isa_peri_peri_a\" :: \"[c,c] => c\"\n  \"isInfinity\" :: c\n  \"isa_lbrk_rbrk_a\" :: \"[c] => c\"\n  \"isa_less_more_a\" :: \"[c] => c\"\n\nend\n\n--- z3\n;; Proof obligation:\n;;\tASSUME NEW VARIABLE VARIABLE_x_,\n;;\t       NEW VARIABLE VARIABLE_y_\n;;\tPROVE  ?VARIABLE_x_#prime = ?VARIABLE_y_#prime\n;;\t       => ?VARIABLE_x_#prime = ?VARIABLE_y_#prime\n;; TLA+ Proof Manager b91fb6c\n;; Proof obligation #1\n;; Generated from file \"./primed_expression.tla\", line 11, characters 3-4\n\n(set-logic UFNIA)\n\n;; Sorts\n\n(declare-sort Idv 0)\n\n;; Hypotheses\n\n; hidden fact\n\n; hidden fact\n\n; omitted declaration of 'CONSTANT_EnabledWrapper_' (second-order)\n\n; omitted declaration of 'CONSTANT_CdotWrapper_' (second-order)\n\n(declare-fun smt__VARIABLE__x__ () Idv)\n\n(declare-fun smt__VARIABLE__x____prime () Idv)\n\n(declare-fun smt__VARIABLE__y__ () Idv)\n\n(declare-fun smt__VARIABLE__y____prime () Idv)\n\n;; Goal\n(assert\n  (!\n    (not\n      (=> (= smt__VARIABLE__x____prime smt__VARIABLE__y____prime)\n        (= smt__VARIABLE__x____prime smt__VARIABLE__y____prime)))\n    :named |Goal|))\n\n(check-sat)\n(exit)"
---*)
