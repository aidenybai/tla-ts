(*---
description: The syntax corpus case "Step Expression With Parameterized Subscript" in step_expressions.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/step_expressions.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE step_expressions_step_expression_with_parameterized_subscript ----
EXTENDS TestPrelude
op == [A]_M(S)!vars
====
---- MODULE TestPrelude ----
VARIABLE A, S
M(y) == INSTANCE M1 WITH B <- y
====
---- MODULE M1 ----
VARIABLE B
vars == << B >>
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./step_expressions_step_expression_with_parameterized_subscript.tla", line 12, character 12
    Unexpected (

    @type: warning
    @msg: File "./step_expressions_step_expression_with_parameterized_subscript.tla", line 12, character 12

    Unexpected (

    File "./step_expressions_step_expression_with_parameterized_subscript.tla", line 12, character 12
    Unexpected (
    File "<unknown>":
    Error: Could not parse "./step_expressions_step_expression_with_parameterized_subscript.tla" successfully.
     tlapm ending abnormally with Failure("Module.Parser.parse_file")
---*)
