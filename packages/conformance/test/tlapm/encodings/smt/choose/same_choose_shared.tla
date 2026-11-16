(*---
description: The same CHOOSE expression twice is abstracted as one symbol.
ref: src/encode/n_axiomatize.ml#main
mode: encoding
outcome: proved
---*)
---- MODULE same_choose_shared ----
EXTENDS TLAPS
THEOREM ASSUME NEW a PROVE (CHOOSE x : x # a) = (CHOOSE x : x # a)
  BY SMT
====

(*--- recorded
all:
  exit: 0
  transcript: "@type: obligation\n@id: 1\n@loc: 10:3:10:5\n@status: to be proved\n\n@type: obligation\n@id: 1\n@loc: 10:3:10:5\n@status: proved\n@prover: smt\n@meth: time-limit: 5\n@already: false\n\n@type: obligation\n@id: 2\n@loc: 10:6:10:9\n@status: to be proved\n\n@type: obligation\n@id: 2\n@loc: 10:6:10:9\n@status: trivial\n@prover: tlapm\n@already: false\n\n@type: obligationsnumber\n@count: 2\n\nFile \"./same_choose_shared.tla\", line 7, character 1 to line 11, character 4:\n[INFO]: All 2 obligations proved.\n\n--- isabelle\n(* automatically generated -- do not edit manually *)\ntheory same_choose_shared imports Constant Zenon begin\nML_command \\<open> writeln (\"*** TLAPS PARSED\\n\"); \\<close>\nconsts\n  \"isReal\" :: c\n  \"isa_slas_a\" :: \"[c,c] => c\"\n  \"isa_bksl_diva\" :: \"[c,c] => c\"\n  \"isa_perc_a\" :: \"[c,c] => c\"\n  \"isa_peri_peri_a\" :: \"[c,c] => c\"\n  \"isInfinity\" :: c\n  \"isa_lbrk_rbrk_a\" :: \"[c] => c\"\n  \"isa_less_more_a\" :: \"[c] => c\"\n\nend\n\n--- z3\n;; Proof obligation:\n;;\tASSUME NEW CONSTANT CONSTANT_a_\n;;\tPROVE  (CHOOSE CONSTANT_x_ : CONSTANT_x_ # CONSTANT_a_)\n;;\t       = (CHOOSE CONSTANT_x_ : CONSTANT_x_ # CONSTANT_a_)\n;; TLA+ Proof Manager b91fb6c\n;; Proof obligation #1\n;; Generated from file \"./same_choose_shared.tla\", line 10, characters 3-4\n\n(set-logic UFNIA)\n\n;; Sorts\n\n(declare-sort Idv 0)\n\n;; Hypotheses\n\n; omitted declaration of 'TLA__Choose' (second-order)\n\n; omitted fact (second-order)\n\n; hidden fact\n\n; hidden fact\n\n; omitted declaration of 'CONSTANT_EnabledWrapper_' (second-order)\n\n; omitted declaration of 'CONSTANT_CdotWrapper_' (second-order)\n\n(declare-fun smt__CONSTANT__a__ () Idv)\n\n(declare-fun smt__TLA____Choose__flatnd__1 () Idv)\n\n;; Axiom: ChooseDef TLA__Choose_flatnd_1\n(assert\n  (!\n    (forall ((smt__x Idv))\n      (=> (distinct smt__x smt__CONSTANT__a__)\n        (distinct smt__TLA____Choose__flatnd__1 smt__CONSTANT__a__)))\n    :named |ChooseDef TLA__Choose_flatnd_1|))\n\n;; Goal\n(assert\n  (! (not (= smt__TLA____Choose__flatnd__1 smt__TLA____Choose__flatnd__1))\n    :named |Goal|))\n\n(check-sat)\n(exit)"
---*)
