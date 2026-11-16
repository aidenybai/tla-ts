(*---
description: The syntax corpus case "Conjlist inside ITE" in if_then_else.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/if_then_else.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: proved
---*)
---- MODULE if_then_else_conjlist_inside_ite ----
op ==
  IF
    /\ 1
    /\ 2
      THEN 3
      ELSE 4
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
