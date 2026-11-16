(*---
description: The syntax corpus case "Disjlist with ITE" in if_then_else.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/if_then_else.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: proved
---*)
---- MODULE if_then_else_disjlist_with_ite ----
op ==
  \/  IF 1
      THEN 2
      ELSE 3
  \/ 4
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
