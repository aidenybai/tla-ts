(*---
description: Proof Step ID Subexpression Tree Navigation. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/subexpressions.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE subexpressions_proof_step_id_subexpression_tree_navigation ----
COROLLARY TRUE
PROOF <1>a QED BY <1>a!<<!>>!3!(x, y)!:!@, <1>a!<<!>>!3!(x, y)!:!@
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 10, col 24 to line 10, col 25 of module subexpressions_proof_step_id_subexpression_tree_navigation
    | Nonexistent operand specified by `<<'.
    | line 10, col 49 to line 10, col 50 of module subexpressions_proof_step_id_subexpression_tree_navigation
    | Nonexistent operand specified by `<<'.
    3002:1 Parsing or semantic analysis failed.
---*)
