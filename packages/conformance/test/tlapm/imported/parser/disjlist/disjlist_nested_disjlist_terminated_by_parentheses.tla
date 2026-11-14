(*---
description: The syntax corpus case "Nested Disjlist Terminated by Parentheses" in disjlist.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/disjlist.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: proved
---*)
---- MODULE disjlist_nested_disjlist_terminated_by_parentheses ----
op == (
  \/ 1
  \/  \/ 2
      \/ 3
       )
  \/ 4
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
