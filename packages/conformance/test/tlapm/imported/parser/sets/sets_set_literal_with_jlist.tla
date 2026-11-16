(*---
description: The syntax corpus case "Set Literal with Jlist" in sets.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/sets.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: proved
---*)
---- MODULE sets_set_literal_with_jlist ----
op == {
  /\ 1
  /\ 2
    }
  /\ 3
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
