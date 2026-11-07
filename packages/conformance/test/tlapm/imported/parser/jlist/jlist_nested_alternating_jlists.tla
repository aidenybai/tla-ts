(*---
description: The syntax corpus case "Nested Alternating Jlists" in jlist.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/jlist.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: proved
---*)
---- MODULE jlist_nested_alternating_jlists ----
op ==
  /\  \/ 1
      \/ 2
  /\  \/ 3
      \/  /\ 4
          /\ 5
  /\ 6
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
