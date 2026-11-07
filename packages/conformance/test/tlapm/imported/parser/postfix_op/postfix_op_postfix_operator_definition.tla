(*---
description: The syntax corpus case "Postfix Operator Definition" in postfix_op.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/postfix_op.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: proved
---*)
---- MODULE postfix_op_postfix_operator_definition ----

x^+ == 1
x^* == 2
x^# == 3

====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
