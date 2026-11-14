(*---
description: The syntax corpus case "Empty Tuple" in tuples.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/tuples.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: proved
---*)
---- MODULE tuples_empty_tuple ----
op == <<>> 
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
