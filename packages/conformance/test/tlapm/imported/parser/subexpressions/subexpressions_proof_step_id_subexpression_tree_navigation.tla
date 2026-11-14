(*---
description: The syntax corpus case "Proof Step ID Subexpression Tree Navigation" in subexpressions.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/subexpressions.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE subexpressions_proof_step_id_subexpression_tree_navigation ----
COROLLARY TRUE
PROOF <1>a QED BY <1>a!<<!>>!3!(x, y)!:!@, <1>a!<<!>>!3!(x, y)!:!@
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./subexpressions_proof_step_id_subexpression_tree_navigation.tla", line 12, character 33

    Operator "x" not found

    File "./subexpressions_proof_step_id_subexpression_tree_navigation.tla", line 12, character 33:
    Error: Operator "x" not found
     tlapm ending abnormally with Failure("Expr.Anon: 4")
---*)
