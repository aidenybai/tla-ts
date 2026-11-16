(*---
description: The syntax corpus case "Nested Conjlist Terminated by Parentheses" in conjlist.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/conjlist.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: proved
---*)
---- MODULE conjlist_nested_conjlist_terminated_by_parentheses ----
op == (
  /\ 1
  /\  /\ 2
      /\ 3
       )
  /\ 4
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
