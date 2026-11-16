(*---
description: The syntax corpus case "Conjlist inside LET/IN" in let_in.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/let_in.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: proved
---*)
---- MODULE let_in_conjlist_inside_let_in ----
op ==
  LET
    x ==
      /\ 1
      /\ 2
        IN 3
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
