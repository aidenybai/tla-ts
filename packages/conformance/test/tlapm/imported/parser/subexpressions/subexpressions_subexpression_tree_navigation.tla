(*---
description: The syntax corpus case "Subexpression Tree Navigation" in subexpressions.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/subexpressions.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE subexpressions_subexpression_tree_navigation ----
tree_nav == op(a, b)!<<!>>!3!(x, y)!:!@
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./subexpressions_subexpression_tree_navigation.tla", line 11, character 31

    Operator "x" not found

    File "./subexpressions_subexpression_tree_navigation.tla", line 11, character 31:
    Error: Operator "x" not found
     tlapm ending abnormally with Failure("Expr.Anon: 4")
---*)
