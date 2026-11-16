(*---
description: The syntax corpus case "Conjlist with LET/IN" in let_in.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/let_in.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: proved
---*)
---- MODULE let_in_conjlist_with_let_in ----
op ==
  /\ LET x == 1 IN 2
  /\ 3
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
