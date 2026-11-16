(*---
description: The syntax corpus case "Conjlist with Parentheses" in conjlist.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/conjlist.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: proved
---*)
---- MODULE conjlist_conjlist_with_parentheses ----
op ==
  /\ (1)
  /\ (2)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
