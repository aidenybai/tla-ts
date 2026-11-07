(*---
description: The syntax corpus case "Step Expression Requiring Lookahead" in step_expressions.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/step_expressions.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE step_expressions_step_expression_requiring_lookahead ----
Prop == [][x \in {1, 2}]_x
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./step_expressions_step_expression_requiring_lookahead.tla", line 11, character 26

    Operator "x" not found

    File "./step_expressions_step_expression_requiring_lookahead.tla", line 11, character 26:
    Error: Operator "x" not found
     tlapm ending abnormally with Failure("Expr.Anon: 4")
---*)
