(*---
description: The syntax corpus case "Empty Set" in sets.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/sets.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: proved
---*)
---- MODULE sets_empty_set ----
op == { }
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
