(*---
description: The syntax corpus case "Prefix Operator Declaration as Parameter" in prefix_op.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/prefix_op.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: proved
---*)
---- MODULE prefix_op_prefix_operator_declaration_as_parameter ----

op(
  -. _
) == 11

====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
