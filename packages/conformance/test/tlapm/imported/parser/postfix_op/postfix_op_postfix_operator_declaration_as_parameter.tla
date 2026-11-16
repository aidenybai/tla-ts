(*---
description: The syntax corpus case "Postfix Operator Declaration as Parameter" in postfix_op.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/postfix_op.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: proved
---*)
---- MODULE postfix_op_postfix_operator_declaration_as_parameter ----

op(
  _ ^+,
  _ ^*,
  _ ^#
) == 4

====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
