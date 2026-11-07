(*---
description: The syntax corpus case "ITE with Strings" in if_then_else.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/if_then_else.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: proved
---*)
---- MODULE if_then_else_ite_with_strings ----
op == IF "A" THEN "B" ELSE "C"
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
